export { fakeBackend };

// array in local storage for users
const usersKey = 'vue-3-jwt-refresh-token-users';
const users = JSON.parse(localStorage.getItem(usersKey)) || [];

// add test user and save if users array is empty
if (!users.length) {
    users.push({ id: 1,  firstName: 'Test', lastName: 'User', username: 'test', password: 'test', refreshTokens: [] });
    localStorage.setItem(usersKey, JSON.stringify(users));
}

function fakeBackend() {
    let realFetch = window.fetch;
    window.fetch = function (url, opts) {
        return new Promise((resolve, reject) => {
            // wrap in timeout to simulate server api call
            setTimeout(handleRoute, 500);

            function handleRoute() {   
                const { method } = opts;             
                switch (true) {
                    case url.endsWith('/users/authenticate') && method === 'POST':
                        return authenticate();
                    case url.endsWith('/users/refresh-token') && method === 'POST':
                        return refreshToken();
                    case url.endsWith('/users/revoke-token') && method === 'POST':
                        return revokeToken();
                    case url.endsWith('/users') && method === 'GET':
                        return getUsers();
                    default:
                        // pass through any requests not handled above
                        return realFetch(url, opts)
                            .then(response => resolve(response))
                            .catch(error => reject(error));
                }
            }

            // route functions

            function authenticate() {
                const { username, password } = body();
                const user = users.find(x => x.username === username && x.password === password);

                if (!user) return error('Username or password is incorrect');

                // add refresh token to user
                user.refreshTokens.push(generateRefreshToken());
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    jwtToken: generateJwtToken()
                })
            }

            function refreshToken() {
                const refreshToken = getRefreshToken();
                
                if (!refreshToken) return unauthorized();

                const user = users.find(x => x.refreshTokens.includes(refreshToken));
                
                if (!user) return unauthorized();

                // replace old refresh token with a new one and save
                user.refreshTokens = user.refreshTokens.filter(x => x !== refreshToken);
                user.refreshTokens.push(generateRefreshToken());
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    jwtToken: generateJwtToken()
                })
            }

            function revokeToken() {
                if (!isLoggedIn()) return unauthorized();
                
                const refreshToken = getRefreshToken();
                const user = users.find(x => x.refreshTokens.includes(refreshToken));
                
                // revoke token and save
                user.refreshTokens = user.refreshTokens.filter(x => x !== refreshToken);
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok();
            }

            function getUsers() {
                if (!isLoggedIn()) return unauthorized();
                return ok(users);
            }

            // helper functions

            function ok(body) {
                resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) })
            }

            function unauthorized() {
                resolve({ status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })) })
            }

            function error(message) {
                resolve({ status: 400, text: () => Promise.resolve(JSON.stringify({ message })) })
            }

            function isLoggedIn() {
                // check if jwt token is in auth header
                const authHeader = opts.headers['Authorization'] || '';
                if (!authHeader.startsWith('Bearer fake-jwt-token'))
                    return false;

                // check if token is expired
                try {
                    const jwtToken = JSON.parse(atob(authHeader.split('.')[1]));
                    const tokenExpired = Date.now() > (jwtToken.exp * 1000);
                    if (tokenExpired)
                        return false;
                } catch {
                    return false;
                }

                return true;
            }

            function body() {
                return opts.body && JSON.parse(opts.body);
            }

            function generateJwtToken() {
                // create token that expires in 15 minutes
                const tokenPayload = { exp: Math.round(new Date(Date.now() + 15*60*1000).getTime() / 1000) }
                return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
            }

            function generateRefreshToken() {
                const token = new Date().getTime().toString();

                // add token cookie that expires in 7 days
                const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString();
                document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/`;

                return token;
            }

            function getRefreshToken() {
                // get refresh token from cookie
                return (document.cookie.split(';').find(x => x.includes('fakeRefreshToken')) || '=').split('=')[1];
            }
        });
    }
}

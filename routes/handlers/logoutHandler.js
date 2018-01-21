const logout = (request, h) => { 
    request.cookieAuth.clear();
    return h.redirect('/');
};
export default logout;


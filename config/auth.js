module.exports = {
    //Ensures users don't access the dashboard when logged out
    ensureAuthenticated: function (req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Login to access the dashboard');
        res.redirect('/login');
    },

    //Ensures users don't access the signup/login page when logged in
    forwardAuthenticated: function (req, res, next) {
        if(!req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'You are already logged in!');
        res.redirect('/user/dashboard');
    }
};
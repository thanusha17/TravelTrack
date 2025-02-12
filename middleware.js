module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        // console.log(req);
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You have to Login to proceed");
        return res.redirect("/login");
    }
    next();
}
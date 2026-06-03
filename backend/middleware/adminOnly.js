

function adminOnly(req, res, next) {
    if (req.session.user?.role === "admin") {
        return next();
    }
    res.status(403).send("Access denied");
}

module.exports = adminOnly ;
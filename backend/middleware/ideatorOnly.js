function ideatorOnly(req, res, next) {
    if (req.session.user?.role === "ideator") {
        return next();
    }
    res.status(403).send("Access denied");
}

module.exports = ideatorOnly ;
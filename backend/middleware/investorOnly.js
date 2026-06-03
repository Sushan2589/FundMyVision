function investorOnly(req, res, next) {
    if (req.session.user?.role === "investor") {
        return next();
    }
    res.status(403).send("Access denied");
}

module.exports = investorOnly ;
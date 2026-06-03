function kycApproved(req, res, next) {

    const user = req.session.user;

    // Only investors need KYC
    if (user.role === "investor") {

        if (user.verification_status !== "approved") {
            return res.status(403).json({
                error: "KYC approval required"
            });
        }

    }

    next();
}

module.exports = kycApproved;
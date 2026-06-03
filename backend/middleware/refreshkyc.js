const db = require("../db");

async function refreshKyc(req, res, next) {

    if (
        req.session.user &&
        req.session.user.role === "investor"
    ) {

        db.get(
            `
            SELECT verification_status
            FROM investor_profiles
            WHERE userid = ?
            `,
            [req.session.user.id],
            (err, row) => {

                if (row) {
                    req.session.user.verification_status =
                        row.verification_status;
                }

                next();
            }
        );

        return;
    }

    next();
}

module.exports = refreshKyc;
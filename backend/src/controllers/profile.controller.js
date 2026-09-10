import * as profileService from "../services/profile.service.js";
import handleError from "../utils/handleError.js";

export async function getProfile(req, res) {
	try {
		const usuario = await profileService.getProfile(req.user.id);
		return res.status(200).json({ user: usuario });
	} catch (error) {
		return handleError(res, error, "profile.controller");
	}
}

export async function updateProfile(req, res) {
	try {
		const usuario = await profileService.updateProfile(req.user.id, req.body || {});
		return res.status(200).json({ user: usuario });
	} catch (error) {
		return handleError(res, error, "profile.controller");
	}
}

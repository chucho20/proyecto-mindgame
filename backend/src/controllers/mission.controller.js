export async function listarMisiones(req, res) {
	try {
		const usuarioId = req.user.id;
		const { categoria } = req.query;

		const misiones = await misionService.listar(
			usuarioId,
			{ categoria },
		);

		return res.status(200).json(misiones);
	} catch (error) {
		return handleError(error, res);
	}
}
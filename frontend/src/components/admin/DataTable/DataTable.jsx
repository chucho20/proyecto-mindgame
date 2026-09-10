import "./DataTable.css";

/**
 * Tabla genérica reusada por las 4 páginas admin de listado (misiones,
 * retos, actividades, contenidos). `columns`: [{ key, label, render? }].
 * `renderActions(row)` es opcional y agrega una columna final de acciones.
 */
function DataTable({ columns, rows, rowKey = "id", emptyMessage = "No hay datos todavía.", renderActions }) {
	if (!rows || rows.length === 0) {
		return <p className="data-table__empty">{emptyMessage}</p>;
	}

	return (
		<div className="data-table__wrapper">
			<table className="data-table">
				<thead>
					<tr>
						{columns.map((column) => (
							<th key={column.key}>{column.label}</th>
						))}
						{renderActions ? <th>Acciones</th> : null}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row[rowKey]}>
							{columns.map((column) => (
								<td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
							))}
							{renderActions ? <td className="data-table__actions">{renderActions(row)}</td> : null}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default DataTable;

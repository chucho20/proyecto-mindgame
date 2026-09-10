import { useId, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import "./PasswordInput.css";

/**
 * Campo de contraseña reutilizable con botón para mostrar/ocultar el valor.
 */
function PasswordInput({ label, id, value, onChange, placeholder, required = false, autoComplete }) {
	const [visible, setVisible] = useState(false);
	const generatedId = useId();
	const inputId = id || generatedId;

	return (
		<div className="password-input">
			{label ? (
				<label className="password-input__label" htmlFor={inputId}>
					{label}
				</label>
			) : null}

			<div className="password-input__field">
				<input
					id={inputId}
					className="password-input__control"
					type={visible ? "text" : "password"}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					required={required}
					autoComplete={autoComplete}
				/>

				<button
					type="button"
					className="password-input__toggle"
					onClick={() => setVisible((prev) => !prev)}
					aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
					aria-pressed={visible}
				>
					{visible ? <FiEyeOff /> : <FiEye />}
				</button>
			</div>
		</div>
	);
}

export default PasswordInput;

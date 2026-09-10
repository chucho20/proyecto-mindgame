// Lista mínima de avatares predefinidos (RF-006). Se guarda solo el id.
export const AVATAR_OPTIONS = [
	{ id: "avatar-fox", emoji: "🦊" },
	{ id: "avatar-panda", emoji: "🐼" },
	{ id: "avatar-tiger", emoji: "🐯" },
	{ id: "avatar-frog", emoji: "🐸" },
	{ id: "avatar-monkey", emoji: "🐵" },
	{ id: "avatar-lion", emoji: "🦁" },
	{ id: "avatar-koala", emoji: "🐨" },
	{ id: "avatar-owl", emoji: "🦉" },
];

export function avatarEmoji(avatarId) {
	return AVATAR_OPTIONS.find((option) => option.id === avatarId)?.emoji || "🙂";
}

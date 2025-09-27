export const createHeaderFactory = (getCellSx = () => {}) => {
	return ({ id, content, onClick = () => {}, render = () => {} }) => {
		return {
			id,
			content,
			onClick,
			getCellSx,
			render,
		};
	};
};

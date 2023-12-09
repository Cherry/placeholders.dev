declare module '@cloudfour/simple-svg-placeholder' {
	type Options = {
		width?: number;
		height?: number;
		text?: string;
		dy?: string;
		fontFamily?: string;
		fontWeight?: string | number;
		fontSize?: number;
		bgColor?: string;
		textColor?: string;
		dataUri?: boolean;
		charset?: string;
	};
	export default function generateSVG(options: Options): string;
	export type { Options };
}

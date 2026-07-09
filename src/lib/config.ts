const ORIGIN = import.meta.env.ORIGIN || 'http://localhost:5173';

export const siteConfig = {
	name: 'CV TapioLeaf',
	description:
		'Produsen tepung tapioka berkualitas tinggi. Mengolah singkong pilihan menjadi tepung tapioka premium untuk kebutuhan industri dan rumah tangga.',
	keywords:
		'tepung tapioka, tapioka premium, cv tapioleaf, tepung singkong, pati singkong, tapioka industri, tepung tapioka pati, tapioka food grade',
	url: new URL(ORIGIN),
	ogImage: new URL('/img/og.png', ORIGIN),
	googleVerification: 'OihcPITN_69JSx4bq4ntPc7LIuXFpUxgFvgC_U-vOPg',
	yandexVerification: '',
};

const ORIGIN = import.meta.env.ORIGIN || 'https://www.tapioleaf.my.id';

export const siteConfig = {
	name: 'CV TapioLeaf',
	description:
		'Produsen tepung tapioka berkualitas tinggi. Mengolah singkong pilihan menjadi tepung tapioka premium untuk kebutuhan industri dan rumah tangga.',
	keywords:
		'CV TapioLeaf, tepung tapioka, jual tepung tapioka, produsen tepung tapioka, tepung tapioka Pati',
	url: new URL(ORIGIN),
	ogImage: new URL('/img/og.png', ORIGIN),
	googleVerification: 'ruX52EXN3iKpnKfeenf_eH3_71YYKVLUb8nG6PSSaoE',
	yandexVerification: '',
};

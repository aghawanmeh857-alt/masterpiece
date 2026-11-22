const artwork = {
  lobby: [
    'سعي',
    'خطوتك تبدأ هنا',
    'تعلّم، اشتغل، ووسّع علاقاتك',
    '#ed9d72',
    'M24 108h34V80h34V52h34V24h34'
  ],
  freelance: [
    'العمل الحر',
    'من الفكرة إلى المشروع',
    'تعاون مع مستقلين وابنِ شيئًا جديدًا',
    '#f2a576',
    'M64 36 26 67l38 31m52-62 38 31-38 31M101 24 79 114'
  ],
  academy: [
    'الأكاديمية',
    'تعلّم بالممارسة',
    'دورات تساعدك تبني مهاراتك',
    '#83cabd',
    'M27 35q33-13 63 10 30-23 63-10v60q-33-11-63 12-30-23-63-12ZM90 45v62'
  ],
  internships: [
    'فرص التدريب',
    'خبرة تبدأ بخطوة',
    'اكتسب خبرة مع فريق عمل حقيقي',
    '#f1c384',
    'M27 107h38V82h38V57h38V30h12m-23 0h23v23'
  ],
  jobs: [
    'الوظائف',
    'دورك القادم',
    'اكتشف فرصًا تناسب مهاراتك',
    '#91bfed',
    'M30 50h120v58H30ZM65 50V33h50v17M30 72q60 25 120 0m-68 9h16'
  ],
  events: [
    'الفعاليات',
    'مساحة للقاء',
    'تعرّف على ناس يشاركونك اهتماماتك',
    '#c5afee',
    'M66 36a15 15 0 1 0 30 0 15 15 0 0 0-30 0ZM45 103V89a36 36 0 0 1 72 0v14m-5-78a13 13 0 0 1 0 25m11 14q28 0 28 35'
  ]
};

export function createRoomArt(THREE, scene) {
  const materials = [];
  const geometry = new THREE.PlaneGeometry(3.7, 1.43);

  function hang(section, x, y, z, rotation) {
    const [label, headline, detail, accent, illustration] = artwork[section];
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 296;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ae8c6b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f4eee5';
    ctx.fillRect(7, 7, 754, 282);
    const panel = ctx.createLinearGradient(0, 0, 750, 280);
    panel.addColorStop(0, '#263c51');
    panel.addColorStop(1, '#111f31');
    ctx.fillStyle = panel;
    ctx.fillRect(16, 16, 736, 264);
    ctx.fillStyle = '#ffffff12';
    ctx.beginPath();
    ctx.arc(166, 148, 94, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(76, 81);
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = accent;
    ctx.stroke(new Path2D(illustration));
    ctx.restore();
    ctx.fillStyle = accent;
    ctx.fillRect(710, 66, 4, 162);
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.font = '700 25px Segoe UI, Arial';
    ctx.fillText(label, 687, 92);
    ctx.fillStyle = '#fff4e8';
    ctx.font = '700 46px Segoe UI, Arial';
    ctx.fillText(headline, 687, 157, 391);
    ctx.fillStyle = '#ccd8e5';
    ctx.font = '27px Segoe UI, Arial';
    ctx.fillText(detail, 687, 209, 391);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    materials.push(material);
    const print = new THREE.Mesh(geometry, material);
    print.name = `RoomArt:${section}`;
    print.position.set(x, y, z);
    print.rotation.y = rotation;
    scene.add(print);
  }

  return {
    hang,
    destroy() {
      geometry.dispose();
      for (const material of materials) {
        material.map.dispose();
        material.dispose();
      }
    }
  };
}

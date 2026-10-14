/**
 * Fine facial ink from the authored human drawings, in each pose's source
 * coordinates. Closed mouths are too thin for the color tracer to preserve
 * reliably, so keep their curves explicit and outside the skin/hair palettes.
 * The renderer places these inside the authored pose transform.
 */
const HUMAN_MOUTHS = Object.freeze({
  john: {
    idle: {
      lip: 'M102 82 C112 88 137 92 151 88',
      corner: 'M100 85 Q101 80 105 81',
      crease: 'M129 95 Q135 97 141 95',
    },
    embarrassed: {
      lip: 'M124 84 C131 93 146 99 156 97',
      corner: 'M122 85 Q122 81 126 83',
      crease: 'M140 104 Q146 107 151 105',
    },
  },
  maya: {
    idle: {
      lip: 'M177 121 C183 119 189 118 194 119',
      corner: 'M188 116 Q191 115 193 118',
      crease: 'M184 126 Q189 127 193 124',
    },
    embarrassed: {
      lip: 'M126 121 C133 128 146 132 153 128',
      corner: 'M124 122 Q124 119 127 121',
      crease: 'M139 136 Q144 138 149 135',
    },
  },
  brad: {
    idle: {
      lip: 'M122 71 C127 81 140 87 150 86',
      corner: 'M120 73 Q120 68 124 70',
      crease: 'M140 93 Q145 95 149 92',
    },
    embarrassed: {
      lip: 'M126 77 C131 89 143 96 151 94',
      corner: 'M124 78 Q124 73 128 75',
      crease: 'M141 102 Q146 104 150 101',
    },
  },
});

export function renderFacialDetails(archetype, frame) {
  const mouth = HUMAN_MOUTHS[archetype]?.[frame];
  if (!mouth) return '';
  return `<g data-part="mouth" data-paint="fixed" fill="none" stroke="#301b27" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="2.4" d="${mouth.lip}"/><path stroke-width="1.8" d="${mouth.corner}"/><path stroke-width="1.3" opacity=".4" d="${mouth.crease}"/></g>`;
}

// These small features need their own authored curves: the silhouette tracer
// merges her far eyelid with its shading and treats warm ear folds as hair.
// Coordinates follow the original six drawings, including asymmetric eyes,
// foreshortening, closed lids and the ear lobe tucked behind the curl.
const MAYA_FEATURES = {
  idle: {
    skin: '#dc7c48',
    eyes: [
      {
        cover: 'M138 82 C151 77 171 77 180 87 L180 102 C168 110 145 110 137 96 Z',
        white: 'M143 91 C154 92 166 93 177 94 C172 108 151 107 143 91 Z',
        pupil: 'M152 92 C151 98 156 101 161 100 C166 99 168 96 167 93 Z',
        lash: 'M141 86 C152 87 167 89 180 92 L177 96 C166 94 152 93 143 92 L135 83 C138 83 139 85 141 86 Z',
        crease: 'M146 85 C153 75 169 75 175 86',
      },
      {
        cover: 'M187 79 C193 74 205 76 213 83 L215 96 C208 106 194 107 187 97 Z',
        white: 'M189 93 C197 89 206 87 215 87 C211 103 197 104 189 93 Z',
        pupil: 'M189 92 C188 97 192 99 196 97 C200 96 201 92 200 89 Z',
        lash: 'M187 91 C195 87 206 85 216 83 L221 79 L219 86 L215 89 C206 89 197 92 189 95 Z',
        crease: 'M188 87 C191 77 205 76 211 83',
      },
    ],
    ear: {
      outline: 'M108 98 C113 93 120 95 125 100 C127 105 130 107 136 111 C139 114 134 117 129 117 C130 122 124 124 120 120 C112 119 105 112 106 105 C106 102 106 100 108 98 Z',
      shade: 'M111 103 C114 99 120 101 124 106 L130 112 C123 115 118 109 117 106 C114 105 112 109 112 112 C109 110 109 106 111 103 Z',
      fold: 'M112 104 C114 100 120 103 122 108 M120 106 C117 111 121 114 125 114',
      stud: [126,121],
    },
  },
  talking: {
    skin: '#db7b47',
    eyes: [
      {
        cover: 'M135 82 C146 75 163 76 173 84 L174 101 C162 111 144 110 134 98 Z',
        white: 'M140 94 C150 91 163 90 173 90 C169 107 149 109 140 94 Z',
        pupil: 'M158 91 C156 97 161 102 166 101 C171 100 173 95 171 90 Z',
        lash: 'M138 89 C149 87 163 87 175 88 L172 93 C161 92 150 92 141 96 L133 88 Z',
        crease: 'M141 86 C148 78 161 77 169 84',
      },
      {
        cover: 'M184 77 C193 72 204 72 211 80 L214 95 C205 104 191 104 183 97 Z',
        white: 'M185 92 C194 86 204 83 214 83 C209 101 194 103 185 92 Z',
        pupil: 'M197 85 C193 91 196 95 201 94 C205 93 207 87 205 83 Z',
        lash: 'M182 91 C190 84 203 81 212 80 L218 74 L216 82 L211 85 C202 85 194 90 185 94 Z',
        crease: 'M184 87 C187 77 200 74 207 79',
      },
    ],
    ear: {
      outline: 'M105 101 C112 96 120 99 124 105 C127 109 131 111 136 113 C140 115 136 119 132 119 C133 124 128 128 123 125 C112 125 103 118 102 110 C101 106 103 103 105 101 Z',
      shade: 'M107 106 C111 102 118 104 123 109 L130 116 C123 119 118 113 116 109 C112 107 108 111 108 115 C105 113 105 109 107 106 Z',
      fold: 'M108 108 C110 103 117 106 120 111 M118 109 C115 114 119 118 124 119',
      stud: [127,125],
    },
  },
  angry: {
    skin: '#dd7d48',
    eyes: [
      {
        cover: 'M167 96 C179 93 199 94 210 102 L211 113 C197 124 179 122 168 109 Z',
        white: 'M174 103 C185 102 198 103 207 104 C203 120 182 123 174 103 Z',
        pupil: 'M193 104 C190 111 194 116 199 114 C204 113 206 109 204 104 Z',
        lash: 'M173 99 C184 100 199 101 211 102 L208 107 C197 105 184 105 176 107 L165 98 Z',
        crease: 'M177 97 C185 93 198 95 205 99',
      },
      {
        cover: 'M216 90 C224 85 237 82 243 88 L244 105 C238 114 223 115 216 106 Z',
        white: 'M218 104 C225 98 235 94 242 94 C240 112 225 116 218 104 Z',
        pupil: 'M228 100 C227 106 231 110 235 107 C239 104 240 99 237 97 Z',
        lash: 'M215 103 C224 95 234 91 241 90 L247 86 L245 93 L241 97 C233 98 226 102 218 106 Z',
        crease: 'M219 96 C225 89 233 86 239 88',
      },
    ],
    ear: {
      outline: 'M139 115 C146 111 153 114 157 120 C161 124 164 125 171 127 C177 129 173 134 168 133 C169 138 164 141 159 137 C149 137 139 131 137 123 C136 119 137 117 139 115 Z',
      shade: 'M141 120 C145 116 152 118 157 123 L165 130 C157 132 153 128 150 124 C146 122 143 125 142 129 C139 127 138 123 141 120 Z',
      fold: 'M143 121 C146 117 152 120 154 125 M153 123 C150 128 154 131 159 132',
      stud: [162,138],
    },
  },
  embarrassed: {
    skin: '#da7c49',
    eyes: [
      {
        cover: 'M108 85 C120 84 137 92 144 99 L142 111 C127 116 115 107 108 96 Z',
        white: 'M114 94 C123 93 132 98 141 102 C137 115 120 109 114 94 Z',
        pupil: 'M130 98 C127 104 131 110 136 108 C140 106 141 103 139 101 Z',
        lash: 'M114 90 C122 90 134 96 144 101 L140 105 C131 100 122 96 115 96 L108 87 L110 87 Z',
        crease: 'M114 86 C122 87 133 93 139 96',
      },
      {
        cover: 'M151 98 C158 96 169 99 173 105 L170 117 C160 123 150 117 149 109 Z',
        white: 'M152 108 C159 103 167 104 172 106 C170 119 157 122 152 108 Z',
        pupil: 'M161 106 C159 112 163 117 167 114 C170 112 170 109 169 106 Z',
        lash: 'M149 106 C156 101 165 101 172 103 L177 102 L174 108 C166 107 158 108 152 111 Z',
        crease: 'M154 99 C160 97 168 101 172 105',
      },
    ],
    ear: {
      outline: 'M80 94 C85 88 93 91 97 97 C100 103 103 106 109 109 C114 112 108 116 104 114 C104 119 99 121 94 116 C85 116 79 111 78 104 C77 100 78 97 80 94 Z',
      shade: 'M82 100 C85 95 92 97 96 103 L103 109 C97 112 93 107 90 103 C86 101 83 105 83 109 C80 107 80 103 82 100 Z',
      fold: 'M83 100 C86 95 92 99 94 103 M93 103 C89 108 94 111 98 111',
      stud: [96,116],
    },
  },
  celebrate: {
    skin: '#dd7c49',
    eyes: [
      {
        cover: 'M145 69 C157 63 176 65 187 76 L186 85 C171 88 154 88 145 81 Z',
        lash: 'M151 79 C160 71 172 73 186 79 C172 77 162 79 153 84 L145 79 L149 79 Z',
      },
      {
        cover: 'M199 57 C209 51 222 51 231 59 L233 74 C221 78 208 79 199 73 Z',
        lash: 'M201 71 C209 59 219 58 229 61 L236 57 L233 64 C222 62 211 64 203 75 Z',
      },
    ],
    ear: {
      outline: 'M128 100 C134 96 142 99 146 104 C150 108 153 108 158 108 C164 110 161 115 156 115 C157 121 151 124 147 119 C137 120 128 114 127 107 C126 104 126 102 128 100 Z',
      shade: 'M131 104 C135 100 141 103 145 107 L153 113 C146 116 142 110 138 107 C135 106 132 110 132 114 C129 112 129 107 131 104 Z',
      fold: 'M132 105 C135 100 141 104 143 108 M141 107 C139 112 143 115 147 115',
      stud: [149,120],
    },
  },
  shocked: {
    skin: '#de7e4a',
    eyes: [
      {
        cover: 'M133 70 C145 61 169 62 178 79 L179 98 C166 110 143 108 134 92 Z',
        white: 'M143 82 C141 69 155 66 166 71 C174 76 177 91 171 98 C158 108 141 99 143 82 Z',
        pupil: 'M158 82 C158 73 169 73 170 82 C172 91 160 96 158 86 Z',
        lash: 'M140 77 C145 68 157 65 167 71 C155 67 147 72 144 80 L141 83 L135 82 L131 78 L138 79 Z',
        highlight: [165,80],
      },
      {
        cover: 'M178 66 C189 59 204 60 211 74 L213 94 C204 105 184 103 178 90 Z',
        white: 'M182 79 C183 66 197 64 205 74 C211 82 207 96 197 98 C186 99 180 91 182 79 Z',
        pupil: 'M186 80 C186 71 196 71 197 80 C198 89 187 94 186 84 Z',
        lash: 'M180 76 C186 66 198 64 205 71 C194 67 187 71 183 80 L181 82 L179 78 Z',
        highlight: [192,77],
      },
    ],
    ear: {
      outline: 'M117 102 C122 98 129 101 133 106 C136 110 139 111 144 112 C150 114 147 119 142 118 C143 123 138 126 134 122 C124 122 116 116 115 109 C115 106 115 104 117 102 Z',
      shade: 'M119 107 C123 102 129 105 133 110 L141 116 C135 119 130 113 126 110 C123 108 120 112 120 116 C117 114 117 110 119 107 Z',
      fold: 'M120 107 C123 102 129 106 132 110 M130 110 C127 115 131 119 135 119',
      stud: [137,123],
    },
  },
};

export function renderMayaFeatures(frame, paint) {
  const features = MAYA_FEATURES[frame];
  if (!features) return '';
  const skin = paint(features.skin, 'skin');
  const shade = paint('#bb603f', 'skin');
  const fold = paint('#86432d', 'skin');
  const ink = '#201219';
  const eyes = features.eyes.map((eye, index) => `<g data-part="eye-${index === 0 ? 'right' : 'left'}"><path fill="${skin}" d="${eye.cover}"/>${eye.crease ? `<path fill="none" stroke="${fold}" stroke-width="1.15" stroke-linecap="round" opacity=".62" d="${eye.crease}"/>` : ''}${eye.white ? `<path fill="#f8f7f4" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round" d="${eye.white}"/><path fill="${ink}" d="${eye.pupil}"/>` : ''}<path fill="${ink}" d="${eye.lash}"/>${eye.highlight ? `<circle cx="${eye.highlight[0]}" cy="${eye.highlight[1]}" r="1.65" fill="#ffffff"/>` : ''}</g>`).join('');
  const ear = features.ear;
  return `<g data-part="face-details" data-source="authored-curves">${eyes}<g data-part="ear-right"><path fill="${skin}" stroke="${ink}" stroke-width="1.65" stroke-linejoin="round" d="${ear.outline}"/><path fill="${shade}" opacity=".55" d="${ear.shade}"/><path fill="none" stroke="${fold}" stroke-width="1.5" stroke-linecap="round" d="${ear.fold}"/><circle cx="${ear.stud[0]}" cy="${ear.stud[1]}" r="2.8" fill="#e7bd40" stroke="${ink}" stroke-width="1.2"/></g></g>`;
}

const MAYA_FACE_MASKS = {
  idle: 'M145 54 C161 48 188 48 207 57 L212 73 L218 86 L211 113 C206 129 190 140 174 141 C158 140 144 134 132 121 L130 114 L138 109 C128 96 126 83 137 72 Z',
  talking: 'M142 49 C162 47 188 50 202 57 L207 78 L214 91 L206 120 C199 135 186 142 168 142 L140 132 L126 123 L123 105 L127 80 Z',
  angry: 'M167 62 C188 58 220 63 232 71 L240 92 L247 98 L239 132 C237 142 224 151 205 151 L174 141 L158 131 L158 114 L160 86 Z',
  embarrassed: 'M116 59 C135 54 154 60 162 68 L172 95 L173 119 C162 138 144 145 128 143 L102 130 L94 116 L108 100 L104 78 Z',
  celebrate: 'M157 47 C175 38 201 39 219 51 L227 66 L232 85 L224 110 C215 123 197 127 179 124 L153 113 L145 100 L140 84 L145 61 Z',
  shocked: 'M147 43 C161 34 188 36 201 43 L206 64 L214 78 L213 106 C208 119 194 128 173 127 L144 119 L131 108 L129 94 L132 71 Z',
};
const MAYA_RING_BOXES = {
  idle: [[109,118,28,26],[199,115,22,24]],
  talking: [[108,124,28,25],[199,115,20,24]],
  angry: [[138,135,28,25],[232,124,20,23]],
  embarrassed: [[80,115,21,20],[162,125,20,22]],
  celebrate: [[129,115,27,24],[218,90,18,24]],
  shocked: [[114,118,26,25],[203,104,20,22]],
};
function detailEllipse(x,y,w,h) {
  const cx=x+w/2,cy=y+h/2,rx=w/2,ry=h/2,k=.552285;
  return `M${cx} ${y} C${cx+rx*k} ${y} ${x+w} ${cy-ry*k} ${x+w} ${cy} C${x+w} ${cy+ry*k} ${cx+rx*k} ${y+h} ${cx} ${y+h} C${cx-rx*k} ${y+h} ${x} ${cy+ry*k} ${x} ${cy} C${x} ${cy-ry*k} ${cx-rx*k} ${y} ${cx} ${y} Z`;
}

/** Spatial color guards keep small warm facial shadows out of the hair palette. */
export function getMayaPaletteMasks(frame) {
  const face=MAYA_FACE_MASKS[frame],features=MAYA_FEATURES[frame];
  if(!face||!features)return null;
  const jewelry=MAYA_RING_BOXES[frame].map(([x,y,w,h])=>detailEllipse(x,y,w,h)+' '+detailEllipse(x+4,y+4,w-8,h-8)).join(' ');
  return {face:face+' '+features.ear.outline,jewelry};
}

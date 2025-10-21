import OpenAI from 'openai';

export class PatternGenerator {
  private client: OpenAI;
  private model: string;

  // COMPLETE sound library from your list
  private allValidSounds = {
    // All synths you provided
    synths: [
      'brown', 'bytebeat', 'crackle', 'pink', 'pulse', 'sawtooth', 'sine', 'square', 
      'supersaw', 'triangle', 'white', 'z_noise', 'z_sawtooth', 'z_sine', 'z_square', 
      'z_tan', 'z_triangle', 'zzfx'
    ],

    // All GM instruments you provided (127 of them)
    gmInstruments: [
      'gm_accordion', 'gm_acoustic_bass', 'gm_acoustic_guitar_nylon', 'gm_acoustic_guitar_steel',
      'gm_agogo', 'gm_alto_sax', 'gm_applause', 'gm_bagpipe', 'gm_bandoneon', 'gm_banjo',
      'gm_baritone_sax', 'gm_bassoon', 'gm_bird_tweet', 'gm_blown_bottle', 'gm_brass_section',
      'gm_breath_noise', 'gm_celesta', 'gm_cello', 'gm_choir_aahs', 'gm_church_organ',
      'gm_clarinet', 'gm_clavinet', 'gm_contrabass', 'gm_distortion_guitar', 'gm_drawbar_organ',
      'gm_dulcimer', 'gm_electric_bass_finger', 'gm_electric_bass_pick', 'gm_electric_guitar_clean',
      'gm_electric_guitar_jazz', 'gm_electric_guitar_muted', 'gm_english_horn', 'gm_epiano1',
      'gm_epiano2', 'gm_fiddle', 'gm_flute', 'gm_french_horn', 'gm_fretless_bass',
      'gm_fx_atmosphere', 'gm_fx_brightness', 'gm_fx_crystal', 'gm_fx_echoes', 'gm_fx_goblins',
      'gm_fx_rain', 'gm_fx_sci_fi', 'gm_fx_soundtrack', 'gm_glockenspiel', 'gm_guitar_fret_noise',
      'gm_guitar_harmonics', 'gm_gunshot', 'gm_harmonica', 'gm_harpsichord', 'gm_helicopter',
      'gm_kalimba', 'gm_koto', 'gm_lead_1_square', 'gm_lead_2_sawtooth', 'gm_lead_3_calliope',
      'gm_lead_4_chiff', 'gm_lead_5_charang', 'gm_lead_6_voice', 'gm_lead_7_fifths',
      'gm_lead_8_bass_lead', 'gm_marimba', 'gm_melodic_tom', 'gm_music_box', 'gm_muted_trumpet',
      'gm_oboe', 'gm_ocarina', 'gm_orchestra_hit', 'gm_orchestral_harp', 'gm_overdriven_guitar',
      'gm_pad_bowed', 'gm_pad_choir', 'gm_pad_halo', 'gm_pad_metallic', 'gm_pad_new_age',
      'gm_pad_poly', 'gm_pad_sweep', 'gm_pad_warm', 'gm_pan_flute', 'gm_percussive_organ',
      'gm_piano', 'gm_piccolo', 'gm_pizzicato_strings', 'gm_recorder', 'gm_reed_organ',
      'gm_reverse_cymbal', 'gm_rock_organ', 'gm_seashore', 'gm_shakuhachi', 'gm_shamisen',
      'gm_shanai', 'gm_sitar', 'gm_slap_bass_1', 'gm_slap_bass_2', 'gm_soprano_sax',
      'gm_steel_drums', 'gm_string_ensemble_1', 'gm_string_ensemble_2', 'gm_synth_bass_1',
      'gm_synth_bass_2', 'gm_synth_brass_1', 'gm_synth_brass_2', 'gm_synth_choir',
      'gm_synth_drum', 'gm_synth_strings_1', 'gm_synth_strings_2', 'gm_taiko_drum',
      'gm_telephone', 'gm_tenor_sax', 'gm_timpani', 'gm_tinkle_bell', 'gm_tremolo_strings',
      'gm_trombone', 'gm_trumpet', 'gm_tuba', 'gm_tubular_bells', 'gm_vibraphone',
      'gm_viola', 'gm_violin', 'gm_voice_oohs', 'gm_whistle', 'gm_woodblock', 'gm_xylophone'
    ],

    // All basic drums (simple names)
    basicDrums: ['bd', 'sd', 'hh', 'oh', 'cp', 'cr', 'ht', 'lt', 'mt', 'rd', 'rim', 'cb', 'perc'],

    // All drum machine collections you provided (30+ machines)
    drumMachines: [
      '9000', 'ace', 'ajkpercusyn', 'akailinn', 'akaimpc60', 'akaixr10', 'alesishr16',
      'alesissr16', 'bossdr110', 'bossdr220', 'bossdr55', 'bossdr550', 'casiorz1',
      'casiosk1', 'casiovl1', 'circuitsdrumtracks', 'circuitstom', 'compurhythm1000',
      'compurhythm78', 'compurhythm8000', 'concertmatemg1', 'd110', 'd70', 'ddm110',
      'ddr30', 'dmx', 'doepferms404', 'dpm48', 'dr110', 'dr220', 'dr55', 'dr550',
      'drumulator', 'emudrumulator', 'emumodular', 'emusp12', 'hr16', 'jd990',
      'korgddm110', 'korgkpr77', 'korgkr55', 'korgkrz', 'korgm1', 'korgminipops',
      'korgpoly800', 'korgt3', 'kpr77', 'kr55', 'krz', 'linn', 'linn9000', 'linndrum',
      'linnlm1', 'linnlm2', 'lm1', 'lm2', 'lm8953', 'm1', 'mc202', 'mc303', 'mfb512',
      'microrhythmer12', 'minipops', 'moogconcertmatemg1', 'mpc1000', 'mpc60',
      'mridangam', 'ms404', 'mt32', 'oberheimdmx', 'percysyn', 'polaris', 'poly800',
      'r8', 'r88', 'rhodespolaris', 'rhythmace', 'rm50', 'rolandcompurhythm1000',
      'rolandtr505', 'rolandtr606', 'rolandtr626', 'rolandtr707', 'rolandtr727',
      'rolandtr808', 'rolandtr909', 'rx21', 'rx5', 'ry30', 'rz1', 's50', 'sakatadpm48',
      'sds400', 'sds5', 'sequentialcircuitsdrumtracks', 'sergemodular', 'sh09',
      'simmonssds400', 'simmonssds5', 'sk1', 'soundmastersr88', 'sp12', 'spacedrum',
      'sr16', 'system100', 't3', 'tg33', 'tr505', 'tr606', 'tr626', 'tr707', 'tr727',
      'tr808', 'tr909', 'univoxmicrorhythmer12', 'viscospacedrum', 'vl1',
      'xdrumlm8953', 'xr10', 'yamaharm50', 'yamaharx21', 'yamaharx5', 'yamahary30',
      'yamahatg33'
    ],

    // All sample instruments you provided (120+ instruments)
    samples: [
      'agogo', 'anvil', 'balafon', 'balafon_hard', 'balafon_soft', 'ballwhistle',
      'bassdrum1', 'bassdrum2', 'belltree', 'bongo', 'brakedrum', 'cabasa', 'cajon',
      'casio', 'clap', 'clash', 'clash2', 'clave', 'clavisynth', 'conga', 'cowbell',
      'crow', 'dantranh', 'dantranh_tremolo', 'dantranh_vibrato', 'darbuka',
      'didgeridoo', 'east', 'fingercymbal', 'flexatone', 'fmpiano', 'folkharp',
      'framedrum', 'glockenspiel', 'gong', 'gong2', 'guiro', 'handbells', 'handchimes',
      'harmonica', 'harmonica_soft', 'harmonica_vib', 'harp', 'hihat', 'insect',
      'jazz', 'kalimba', 'kalimba2', 'kalimba3', 'kalimba4', 'kalimba5', 'kawai',
      'marimba', 'marktrees', 'metal', 'num', 'numbers', 'ocarina', 'ocarina_small',
      'ocarina_small_stacc', 'ocarina_vib', 'oceandrum', 'organ_4inch', 'organ_8inch',
      'organ_full', 'piano', 'piano1', 'pipeorgan_loud', 'pipeorgan_loud_pedal',
      'pipeorgan_quiet', 'pipeorgan_quiet_pedal', 'psaltery_bow', 'psaltery_pluck',
      'psaltery_spiccato', 'ratchet', 'recorder_alto_stacc', 'recorder_alto_sus',
      'recorder_alto_vib', 'recorder_bass_stacc', 'recorder_bass_sus', 'recorder_bass_vib',
      'recorder_soprano_stacc', 'recorder_soprano_sus', 'recorder_tenor_stacc',
      'recorder_tenor_sus', 'recorder_tenor_vib', 'sax', 'sax_stacc', 'sax_vib',
      'saxello', 'saxello_stacc', 'saxello_vib', 'shaker_large', 'shaker_small',
      'siren', 'slapstick', 'sleighbells', 'slitdrum', 'snare_hi', 'snare_low',
      'snare_modern', 'snare_rim', 'space', 'steinway', 'strumstick', 'super64',
      'super64_acc', 'super64_vib', 'sus_cymbal', 'sus_cymbal2', 'tambourine',
      'tambourine2', 'timpani', 'timpani_roll', 'timpani2', 'tom_mallet', 'tom_rim',
      'tom_stick', 'tom2_mallet', 'tom2_rim', 'tom2_stick', 'trainwhistle',
      'triangles', 'tubularbells', 'tubularbells2', 'vibraphone', 'vibraphone_bowed',
      'vibraphone_soft', 'vibraslap', 'wind', 'wineglass', 'wineglass_slow',
      'woodblock', 'xylophone_hard_ff', 'xylophone_hard_pp', 'xylophone_medium_ff',
      'xylophone_medium_pp', 'xylophone_soft_ff', 'xylophone_soft_pp'
    ]
  };

  // Most commonly used sounds for the system prompt
  private popularSounds = {
    essential: ['bd', 'sd', 'hh', 'cp', 'piano', 'sawtooth', 'sine', 'kalimba', 'sax'],
    drums: ['tr808_bd', 'tr909_bd', 'linn_bd', 'dmx_bd'],
    melodic: ['gm_piano', 'gm_epiano1', 'gm_acoustic_bass', 'folkharp', 'marimba'],
    banks: ['tr808', 'tr909', 'linn', 'dmx']
  };

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    if (!apiKey) {
      throw new Error('API key required. Set OPENROUTER_API_KEY environment variable.');
    }
    
    this.model = model || 'anthropic/claude-3-5-sonnet-20241022';
    
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://strudel.cc',
        'X-Title': 'Strudel MCP Bridge'
      }
    });
  }

  // Validate if a sound exists in our complete library
  private isValidSound(soundName: string): boolean {
    const allSounds = [
      ...this.allValidSounds.synths,
      ...this.allValidSounds.gmInstruments,
      ...this.allValidSounds.basicDrums,
      ...this.allValidSounds.samples
    ];
    return allSounds.includes(soundName);
  }

  // Check if a drum machine bank exists
  private isValidBank(bankName: string): boolean {
    return this.allValidSounds.drumMachines.includes(bankName);
  }

  private getSystemPrompt(): string {
    const popularList = Object.values(this.popularSounds).flat().join(', ');

    return `You are an expert Strudel live coding musician. You have access to 2000+ sounds, but focus on the most musical ones.

POPULAR SOUNDS (use these first): ${popularList}

SOUND CATEGORIES AVAILABLE:
- Basic drums: bd, sd, hh, cp, oh, cr, etc.
- Drum machines: Use .bank("tr808"), .bank("tr909"), .bank("linn"), etc.
- GM instruments: gm_piano, gm_acoustic_bass, gm_violin, etc. (127 available)
- Samples: piano, sax, kalimba, marimba, folkharp, woodblock, clave, etc. (120+ available)
- Synths: sawtooth, sine, square, pulse, supersaw, etc.

PROVEN WORKING EXAMPLES:

1. CLASSIC HOUSE:
setcps(0.5)
stack(
  s("bd*4").bank("tr809"),
  s("~ cp ~ cp").bank("tr909"),
  s("hh*8").bank("tr909").gain(0.4)
)

2. MELODIC PATTERN:
setcps(0.5)
stack(
  note("c d e f g").s("kalimba").room(0.4),
  s("bd ~ sd ~"),
  note("c2*4").s("gm_acoustic_bass")
)

3. JAZZ COMBO:
setcps(0.4)
stack(
  note("c d eb f g").s("sax").room(0.6),
  note("c,e,g").s("gm_piano").room(0.3),
  s("bd ~ sd ~").gain(0.7)
)

SYNTAX RULES:
- ALWAYS start with setcps(number)
- Basic drums: s("bd hh sd")
- With banks: s("bd").bank("tr808")
- Notes: note("c d e f") or note("c,e,g")
- Stack: stack(pattern1, pattern2)
- Effects: .room(0.5), .lpf(1000), .gain(0.8)

CRITICAL OUTPUT RULES:
- Return ONLY executable Strudel code
- NO explanations, NO descriptions, NO markdown
- NO comments in the code
- Just the raw code that can be executed directly`;
  }

  async generatePattern(description: string, style: string = 'general', tempo?: number): Promise<string> {
    // Try templates first for reliability
    const templateResult = this.tryAdvancedPatternTemplate(description, style, tempo);
    if (templateResult) {
      return templateResult;
    }

    // Use AI with access to full sound library
    const systemPrompt = this.getSystemPrompt();
    const bpm = tempo || 120;
    const cps = bpm / 60 / 4;

    const userPrompt = `Create a ${style} pattern: ${description}

You have access to ALL Strudel sounds including:
- 30+ drum machines (tr808, tr909, linn, dmx, etc.)
- 127 GM instruments (gm_piano, gm_violin, etc.)
- 120+ sample instruments (kalimba, sax, marimba, woodblock, clave, etc.)
- 17 synthesizers (sawtooth, sine, pulse, etc.)

Requirements:
- Start with setcps(${cps})
- Be creative with sound choices
- Use appropriate sounds for the style
- Return ONLY executable code - no explanations, no markdown, no comments

Style: ${style}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 600
      });

      let code = response.choices[0].message.content?.trim() || '';
      return this.advancedValidation(code, cps);
    } catch (error) {
      return this.getSafeFallback(style, tempo);
    }
  }

  private tryAdvancedPatternTemplate(description: string, style: string, tempo?: number): string | null {
    const bpm = tempo || 120;
    const cps = bpm / 60 / 4;
    const desc = description.toLowerCase();

    // Advanced templates using more sounds
    const templates = {
      'orchestral': `setcps(${cps})\nstack(note("c d e f").s("gm_violin"), note("c,e,g").s("gm_piano"), note("c1*2").s("gm_contrabass"))`,
      'jazz_ensemble': `setcps(${Math.max(cps * 0.8, 0.4)})\nstack(note("c d eb f").s("sax"), note("c,e,g").s("gm_piano"), note("c2*4").s("gm_acoustic_bass"), s("bd ~ sd ~"))`,
      'world_music': `setcps(${cps})\nstack(note("c d e g").s("kalimba"), note("c2*4").s("gm_sitar"), s("bd").s("darbuka"))`,
      'electronic_complex': `setcps(${cps})\nstack(s("bd*4").bank("tr909"), note("c2*8").s("supersaw").lpf(400), note("c4*4").s("gm_lead_1_square"))`,
      'ambient_orchestra': `setcps(${Math.max(cps * 0.5, 0.2)})\nstack(note("c,e,g").s("gm_pad_warm"), note("c5").s("gm_flute"), note("c2").s("gm_contrabass").slow(4))`,
      'synthwave': `setcps(${cps})\nstack(s("bd*4, ~ cp ~ cp, [~ hh]*4").bank("tr808"), note("c1 ~ g0 ~").s("sawtooth").lpf(200).gain(0.8), note("c,eb,g").s("gm_pad_warm").room(0.6).slow(2), note("<c4 d4 eb4 g3>*2").s("supersaw").lpf(800).delay(0.3))`,
      'dark_synthwave': `setcps(${cps})\nstack(s("bd*4, ~ sd ~ sd, hh*8, ~ ~ oh ~").bank("tr808"), note("c1 ~ ab0 ~").s("sawtooth").lpf(150).gain(0.9), note("c,eb,g").s("gm_pad_warm").room(0.8).slow(4).gain(0.6), note("<c4 eb4 f4 g4>").s("supersaw").lpf(600).delay(0.4).gain(0.7))`,
    };

    if (desc.includes('orchestra') || desc.includes('classical')) {
      return templates.orchestral;
    }
    if (desc.includes('jazz') || desc.includes('swing')) {
      return templates.jazz_ensemble;
    }
    if (desc.includes('world') || desc.includes('ethnic')) {
      return templates.world_music;
    }
    if ((desc.includes('dark') || desc.includes('moody')) && desc.includes('synthwave')) {
      return templates.dark_synthwave;
    }
    if (desc.includes('synthwave') || desc.includes('outrun') || desc.includes('retrowave')) {
      return templates.synthwave;
    }
    if (desc.includes('electronic') && desc.includes('complex')) {
      return templates.electronic_complex;
    }
    if (style.includes('ambient') && desc.includes('orchestra')) {
      return templates.ambient_orchestra;
    }

    return null;
  }

  private advancedValidation(code: string, targetCps: number): string {
    try {
      let clean = this.basicCleanup(code);
      clean = this.validateAllSounds(clean);
      clean = this.validateBanks(clean);
      
      if (!clean.includes('setcps')) {
        clean = `setcps(${targetCps})\n${clean}`;
      }

      return clean;
    } catch (error) {
      console.error('Advanced validation failed:', error);
      return this.getSafeFallback('general', targetCps);
    }
  }

  private basicCleanup(code: string): string {
    // First, try to extract code from markdown code blocks
    const codeBlockMatch = code.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
    }

    // Remove all markdown code block markers
    code = code.replace(/```[\w]*\n?/g, '');

    // Extract only the actual Strudel code by finding the pattern
    // Look for setcps() to the end of the last closing parenthesis
    const strudelCodeMatch = code.match(/setcps\([^)]+\)[\s\S]*?(?:\n(?![a-zA-Z\s]*:|^\d+\.|^-|^I've|^Here|^The|^This))*$/m);
    if (strudelCodeMatch) {
      code = strudelCodeMatch[0];
    }

    // Remove any remaining explanatory text (lines that start with common prose patterns)
    const lines = code.split('\n');
    const codeLinesOnly = [];
    let inCode = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines at the beginning
      if (!inCode && !trimmed) continue;

      // Skip lines that look like explanations
      if (trimmed.match(/^(Here'?s?|I'?ve|This|The|All|Modified:|Generated:|Note:|Added:)/i)) {
        continue;
      }

      // Skip numbered lists and bullet points
      if (trimmed.match(/^(\d+\.|[-*])\s/)) {
        continue;
      }

      // If we hit actual code, start including lines
      if (trimmed.startsWith('setcps') || trimmed.startsWith('stack') || trimmed.startsWith('note') || trimmed.startsWith('s(')) {
        inCode = true;
      }

      if (inCode) {
        codeLinesOnly.push(line);
      }
    }

    // If we found code lines, use them; otherwise use the original
    if (codeLinesOnly.length > 0) {
      code = codeLinesOnly.join('\n');
    }

    // Remove single-line comments but preserve the code
    code = code.replace(/\/\/.*$/gm, '');

    return code.trim();
  }

  private validateAllSounds(code: string): string {
    // Replace invalid sounds with valid ones
    return code.replace(/s\("([^"]+)"\)/g, (match, soundName: string) => {
      if (this.isValidSound(soundName)) {
        return match;
      }

      // Smart substitution based on sound name
      const substitutions: Record<string, string> = {
        'bass': 'gm_acoustic_bass',
        'synth': 'sawtooth',
        'lead': 'gm_lead_1_square',
        'pad': 'gm_pad_warm',
        'strings': 'gm_string_ensemble_1',
        'organ': 'gm_drawbar_organ'
      };

      const substitute = substitutions[soundName.toLowerCase()];
      if (substitute) {
        return `s("${substitute}")`;
      }

      // Default fallback
      return 's("bd")';
    });
  }

  private validateBanks(code: string): string {
    return code.replace(/\.bank\("([^"]+)"\)/g, (match, bankName) => {
      if (this.isValidBank(bankName)) {
        return match;
      }
      // Remove invalid bank reference
      return '';
    });
  }

  private getSafeFallback(style: string, tempo?: number): string {
    const bpm = tempo || 120;
    const cps = bpm / 60 / 4;

    const advancedFallbacks: Record<string, string> = {
      'jazz': `setcps(${Math.max(cps * 0.8, 0.4)})\nstack(note("c d eb f").s("sax"), note("c,e,g").s("gm_piano"))`,
      'orchestral': `setcps(${cps})\nstack(note("c d e f").s("gm_violin"), note("c,e,g").s("gm_piano"))`,
      'electronic': `setcps(${cps})\nstack(s("bd*4, ~ cp ~ cp, hh*8").bank("tr909"), note("c2*4").s("supersaw").lpf(400), note("c,e,g").s("gm_pad_warm").room(0.5))`,
      'synthwave': `setcps(${cps})\nstack(s("bd*4, ~ sd ~ sd, hh*8").bank("tr808"), note("c1 ~ g0 ~").s("sawtooth").lpf(200), note("c,eb,g").s("gm_pad_warm").room(0.6).slow(2))`,
      'world': `setcps(${cps})\nstack(note("c d e g").s("kalimba"), s("bd ~ sd ~"))`,
      'ambient': `setcps(${Math.max(cps * 0.5, 0.2)})\nnote("c,e,g").s("gm_pad_warm").room(1).slow(4)`,
    };

    return advancedFallbacks[style.toLowerCase()] || `setcps(${cps})\nstack(s("bd*4").bank("tr808"), note("c2*4").s("sawtooth").lpf(300))`;
  }

  // Return the COMPLETE sound library
  getAllSounds(): typeof this.allValidSounds {
    return this.allValidSounds;
  }

  // Search for sounds by category or name
  findSounds(query: string): string[] {
    const queryLower = query.toLowerCase();
    const allSounds = [
      ...this.allValidSounds.synths,
      ...this.allValidSounds.gmInstruments, 
      ...this.allValidSounds.basicDrums,
      ...this.allValidSounds.samples
    ];
    
    return allSounds.filter(sound => 
      sound.toLowerCase().includes(queryLower)
    );
  }

  // Get drum machine specific sounds
  getDrumMachinePattern(machine: string): string | null {
    if (!this.isValidBank(machine)) return null;

    const patterns: Record<string, string> = {
      'tr808': 'setcps(0.5)\nstack(s("bd*4").bank("tr808"), s("~ sd ~ sd").bank("tr808"), s("hh*8").bank("tr808"))',
      'tr909': 'setcps(0.5)\nstack(s("bd*4").bank("tr909"), s("~ sd ~ sd").bank("tr909"), s("hh*8").bank("tr909"))',
      'linn': 'setcps(0.5)\nstack(s("bd*4").bank("linn"), s("~ sd ~ sd").bank("linn"), s("hh*8").bank("linn"))',
      'dmx': 'setcps(0.55)\nstack(s("bd*4").bank("dmx"), s("~ sd ~ sd").bank("dmx"), s("hh*8").bank("dmx"))'
    };

    return patterns[machine] || null;
  }

  async modifyPattern(currentCode: string, modification: string): Promise<string> {
    const systemPrompt = `You are an expert Strudel live coding musician. You modify existing patterns based on user requests.

CRITICAL RULES:
- Return ONLY executable Strudel code - NO explanations, NO descriptions, NO comments
- Do NOT include any text before or after the code
- Do NOT use markdown code blocks
- Do NOT add comments explaining what you did
- Just return the raw, executable Strudel code
- Preserve the general structure unless explicitly asked to change it
- Keep working sounds and instruments unless asked to change them
- Always include setcps() at the start`;

    const userPrompt = `Current Strudel pattern:
${currentCode}

Modification requested: ${modification}

Return ONLY the modified Strudel code with no explanations.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      let code = response.choices[0].message.content?.trim() || '';

      // Extract CPS from current code to maintain tempo
      const cpsMatch = currentCode.match(/setcps\(([\d.]+)\)/);
      const currentCps = cpsMatch ? parseFloat(cpsMatch[1]) : 0.5;

      return this.advancedValidation(code, currentCps);
    } catch (error) {
      console.error('Failed to modify pattern:', error);
      // Return original code if modification fails
      return currentCode;
    }
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }
}

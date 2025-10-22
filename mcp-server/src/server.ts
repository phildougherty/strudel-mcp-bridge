#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { BridgeServer } from './websocket/bridge-server.js';

/**
 * Embedded Strudel API Reference Documentation
 * This is embedded directly in the server for portability.
 */
const STRUDEL_REFERENCE = `# Strudel Live Coding Reference

Complete reference for generating Strudel patterns. This document is designed to be read by Claude Code when generating Strudel code.

## Architecture

**You (Claude Code) generate the Strudel code directly.** The MCP server is just a simple bridge that sends your code to the browser. Do NOT ask the MCP server to generate code - YOU generate it!

## Pattern Structure

Every Strudel pattern must follow this structure:

\`\`\`javascript
setcps(NUMBER)  // Required: tempo in cycles per second
stack(          // Preferred: for multi-layered patterns
  LAYER1,
  LAYER2,
  LAYER3
)
\`\`\`

Or for simple single-layer patterns:

\`\`\`javascript
setcps(NUMBER)
s("pattern")
\`\`\`

## Mini-Notation Syntax

Mini-notation is Strudel's pattern language. Every operator has specific meaning:

### Layering (Simultaneous Playback)
- \`,\` (comma) = Play sounds TOGETHER (not sequential!)
- \`"bd,sd,hh"\` = THREE sounds playing simultaneously
- \`"bd*4, ~ sd ~ sd, hh*8"\` = THREE separate rhythm layers

### Timing Operators
- \`*\` (multiply): \`"bd*4"\` = 4 kicks per cycle
- \`~\` (rest): \`"bd ~ sd ~"\` = kick, silence, snare, silence
- \`[]\` (subdivide): \`"bd [hh hh]"\` = kick then two fast hi-hats
- \`<>\` (rotate): \`"<bd sd hh>"\` = one per cycle, rotating
- \`@\` (elongate): \`"bd@2 sd"\` = kick twice as long as snare
- \`!\` (replicate): \`"bd!3"\` = three kicks same duration
- \`?\` (random): \`"bd?0.5"\` = 50% chance to play
- \`|\` (choice): \`"bd|sd|hh"\` = random selection per cycle
- \`(n,m)\` (Euclidean): \`"bd(3,8)"\` = 3 beats in 8 steps
- \`/\` (slow): \`"[bd sd]/2"\` = pattern spans 2 cycles

## Sound Sources

### Basic Drums
Simple names that work with all drum machine banks:
- \`bd\` = bass drum/kick
- \`sd\` = snare drum
- \`hh\` = closed hi-hat
- \`oh\` = open hi-hat
- \`cp\` = clap
- \`cr\` = crash cymbal
- \`rim\` = rimshot
- \`ht\`, \`mt\`, \`lt\` = high/mid/low tom
- \`cb\` = cowbell
- \`perc\` = percussion

Usage: \`s("bd*4, ~ sd ~ sd, hh*8")\`

### Drum Machine Banks
30+ classic drum machines. Use with \`.bank()\`:

**Most Popular:**
- \`tr808\` - Roland TR-808 (iconic bass, snare, hi-hat)
- \`tr909\` - Roland TR-909 (punchy house drums)
- \`linn\` - LinnDrum (80s pop/rock)
- \`dmx\` - Oberheim DMX (hip-hop classic)

**Others:**
- \`tr707\`, \`tr727\`, \`tr505\`, \`tr606\`, \`tr626\`
- \`linnlm1\`, \`linnlm2\`, \`akailinn\`
- \`bossdr55\`, \`bossdr110\`, \`bossdr550\`
- \`mpc60\`, \`sp12\`, \`rx5\`
- And many more...

Usage:
\`\`\`javascript
s("bd*4, ~ sd ~ sd, hh*8").bank("tr808")
// Or use prefix syntax:
s("tr808_bd*4, tr808_sd, tr808_hh")
\`\`\`

### Synth Waveforms
Basic synthesis waveforms:
- \`sine\` - smooth, pure tone
- \`sawtooth\` - bright, buzzy
- \`square\` - hollow, woody
- \`triangle\` - mellow
- \`pulse\` - variable width
- \`supersaw\` - thick, rich (excellent for bass and leads!)

### Noise Generators
- \`white\` - white noise
- \`pink\` - pink noise
- \`brown\` - brown noise
- \`crackle\` - crackling noise (use with \`.density()\`)

### General MIDI Instruments
127 instruments, prefix with \`gm_\`:

**Pianos & Keys:**
- \`gm_piano\`, \`gm_epiano1\`, \`gm_epiano2\`
- \`gm_harpsichord\`, \`gm_clavinet\`

**Bass:**
- \`gm_acoustic_bass\`, \`gm_electric_bass_finger\`, \`gm_electric_bass_pick\`
- \`gm_synth_bass_1\`, \`gm_synth_bass_2\`, \`gm_slap_bass_1\`

**Strings:**
- \`gm_violin\`, \`gm_viola\`, \`gm_cello\`, \`gm_contrabass\`
- \`gm_string_ensemble_1\`, \`gm_string_ensemble_2\`
- \`gm_pizzicato_strings\`, \`gm_tremolo_strings\`

**Brass:**
- \`gm_trumpet\`, \`gm_trombone\`, \`gm_tuba\`
- \`gm_french_horn\`, \`gm_brass_section\`

**Winds:**
- \`gm_flute\`, \`gm_piccolo\`, \`gm_clarinet\`
- \`gm_oboe\`, \`gm_bassoon\`, \`gm_pan_flute\`
- \`gm_tenor_sax\`, \`gm_alto_sax\`, \`gm_soprano_sax\`, \`gm_baritone_sax\`

**Synth Leads:**
- \`gm_lead_1_square\`, \`gm_lead_2_sawtooth\`
- \`gm_lead_3_calliope\`, \`gm_lead_4_chiff\`
- \`gm_lead_5_charang\`, \`gm_lead_6_voice\`

**Synth Pads:**
- \`gm_pad_warm\`, \`gm_pad_poly\`, \`gm_pad_new_age\`
- \`gm_pad_bowed\`, \`gm_pad_metallic\`, \`gm_pad_halo\`

**Ethnic:**
- \`gm_sitar\`, \`gm_koto\`, \`gm_kalimba\`
- \`gm_bagpipe\`, \`gm_shamisen\`, \`gm_shanai\`

**Choir:**
- \`gm_choir_aahs\`, \`gm_voice_oohs\`, \`gm_synth_choir\`

**Organs:**
- \`gm_church_organ\`, \`gm_drawbar_organ\`, \`gm_rock_organ\`
- \`gm_reed_organ\`, \`gm_percussive_organ\`

**Guitar:**
- \`gm_acoustic_guitar_nylon\`, \`gm_acoustic_guitar_steel\`
- \`gm_electric_guitar_clean\`, \`gm_electric_guitar_jazz\`
- \`gm_electric_guitar_muted\`, \`gm_overdriven_guitar\`
- \`gm_distortion_guitar\`

**And 70+ more...**

### Sample Instruments
120+ high-quality samples:

**Melodic:**
- \`piano\`, \`sax\`, \`kalimba\`, \`marimba\`
- \`vibraphone\`, \`xylophone_hard_ff\`, \`glockenspiel\`

**Harmonic:**
- \`folkharp\`, \`harp\`, \`harmonica\`
- \`ocarina\`, \`recorder_alto_sus\`, \`recorder_soprano_sus\`

**Percussive:**
- \`woodblock\`, \`clave\`, \`clap\`, \`cowbell\`
- \`tambourine\`, \`shaker_large\`, \`shaker_small\`

**Textural:**
- \`wind\`, \`oceandrum\`, \`space\`, \`insect\`

**And 100+ more...**

## Notes & Harmony

### Note Notation
\`\`\`javascript
note("c d e f")           // Letter notation (a-g)
note("60 64 67")          // MIDI numbers (60 = middle C)
note("c#4 eb5 f3")        // With accidentals and octaves
note("c,e,g")             // Chords (commas play simultaneously!)
note("60.5 64.25")        // Microtones
\`\`\`

### Scales
\`\`\`javascript
n("0 2 4 7").scale("C:major")              // Scale degrees
n("0 1 2 3").scale("D:minor")              // Different root
n("0 2 4").scale("A2:minor:pentatonic")    // With octave
\`\`\`

**Common scales:**
- \`major\`, \`minor\`, \`dorian\`, \`mixolydian\`, \`lydian\`, \`phrygian\`
- \`major:pentatonic\`, \`minor:pentatonic\`
- \`major:blues\`, \`minor:blues\`
- \`harmonicMinor\`, \`melodicMinor\`, \`diminished\`, \`wholeTone\`

### Chords
\`\`\`javascript
chord("Cm")         // Chord symbols
chord("C7#11")      // Extended chords
chord("Dm/F")       // Slash chords
\`\`\`

### Frequency
\`\`\`javascript
freq("440 880")     // Direct Hz control
\`\`\`

## Time Modifiers

\`\`\`javascript
.fast(n)            // Speed up by n (accepts patterns: .fast("<1 2 4>"))
.slow(n)            // Slow down by n
.rev()              // Reverse pattern
.palindrome()       // Forward then backward
.iter(n)            // Rotate subdivisions each cycle
.ply(n)             // Repeat each event n times
.euclid(beats, steps)           // Euclidean rhythm
.euclidRot(beats, steps, rot)   // With rotation
.early(cycles)      // Shift earlier (in cycles, not seconds!)
.late(cycles)       // Shift later
.every(n, fn)       // Apply function every nth cycle
.when(cond, fn)     // Conditional application
.sometimesBy(prob, fn)          // Random with probability
.swing(n)           // Add swing
.segment(n)         // Sample n times per cycle (for sweeps!)
\`\`\`

## Audio Effects

### Filters (Shape the Sound)

**Low-Pass (removes highs, makes darker/warmer):**
\`\`\`javascript
.lpf(freq)          // Cutoff 0-20000 Hz
.lpq(res)           // Resonance 0-50
\`\`\`

**High-Pass (removes lows, makes thinner):**
\`\`\`javascript
.hpf(freq)          // Cutoff 0-20000 Hz
.hpq(res)           // Resonance 0-50
\`\`\`

**Band-Pass (only center frequencies):**
\`\`\`javascript
.bpf(freq)          // Center frequency
.bpq(res)           // Resonance
\`\`\`

**Vowel Filter:**
\`\`\`javascript
.vowel("a")         // Options: a, e, i, o, u, ae, aa, oe, ue, etc.
\`\`\`

### Filter Envelopes (Animated Sweeps)
\`\`\`javascript
.lpenv(semitones)   // LP sweep depth
.lpa(time)          // LP attack
.lpd(time)          // LP decay
.lps(level)         // LP sustain
.lpr(time)          // LP release
// (Same for HP: hpenv, hpa, hpd, hps, hpr)
// (Same for BP: bpenv, bpa, bpd, bps, bpr)
\`\`\`

### Amplitude Envelope (ADSR - Volume Over Time)
\`\`\`javascript
.attack(time)       // Attack (or .att())
.decay(time)        // Decay (or .dec())
.sustain(level)     // Sustain 0-1 (or .sus())
.release(time)      // Release (or .rel())
.adsr("att:dec:sus:rel")    // Combined: "0.1:0.2:0.7:0.5"
\`\`\`

### Gain & Dynamics
\`\`\`javascript
.gain(level)        // Volume 0-1 (can exceed 1)
.velocity(level)    // Note velocity 0-1
.postgain(level)    // After effects
.compressor("thresh:ratio:knee:att:rel")
\`\`\`

### Distortion & Saturation
\`\`\`javascript
.distort(amount)    // Wavefold distortion 0-10+ (try 2-8)
.dist(amount)       // Alias for distort
.crush(bits)        // Bit crushing 1-16 (4-8 for grit)
.shape(amount)      // Alternative waveshaping
.coarse(factor)     // Sample rate reduction (Chrome only!)
\`\`\`

### Modulation (Movement & Character)
\`\`\`javascript
.vib(hz)            // Vibrato rate (4-8 Hz typical)
.vibmod(depth)      // Vibrato depth in semitones
.vib("hz:depth")    // Combined: "6:1"

.fm(index)          // FM synthesis brightness 0-10+
.fmh(ratio)         // FM harmonicity (2=octave)
.fmattack(time)     // FM envelope attack
.fmdecay(time)      // FM envelope decay

.tremolosync(rate)  // Tremolo rate in cycles
.tremolodepth(depth)// Tremolo intensity 0-1

.phaser(rate)       // Phaser speed
.phaserdepth(depth) // Phaser amount
\`\`\`

### Space & Time (Reverb/Delay)
\`\`\`javascript
.orbit(n)           // Assign to orbit (orbits share effects!)
.room(level)        // Reverb wet 0-1 (try 0.3-0.8)
.room("level:size") // Combined: ".5:8"
.roomsize(size)     // Room size 0-10
.roomfade(time)     // Fade duration
.roomlp(freq)       // Darken reverb tail

.delay(level)       // Delay wet 0-1 (try 0.3-0.6)
.delay("level:time:fb")  // Combined: ".5:.125:.8"
.delaytime(time)    // Delay time in cycles (0.125, 0.25, 0.5)
.delayfeedback(fb)  // Feedback 0-1 (keep under 1!)

.pan(pos)           // Stereo 0-1 (0=left, 0.5=center, 1=right)
.jux(fn)            // Apply function to right channel
.juxBy(amount, fn)  // With amount control
\`\`\`

### Sample Manipulation
\`\`\`javascript
.chop(n)            // Divide into n pieces
.slice(n, pattern)  // Slice and select: .slice(8, "0 4 2 6")
.striate(n)         // Granular chopping
.begin(pos)         // Start point 0-1
.end(pos)           // End point 0-1
.speed(rate)        // Playback speed (negative = reverse)
.loop(1)            // Enable looping
.loopAt(cycles)     // Stretch to fit cycles
.fit()              // Match event duration
.cut(group)         // Cut group (stop overlaps)
\`\`\`

## Pattern Factories

\`\`\`javascript
stack(p1, p2, ...)  // Play simultaneously (PRIMARY for rich music!)
seq(p1, p2, ...)    // Sequence in one cycle (fastcat)
cat(p1, p2, ...)    // One per cycle (slowcat)
run(n)              // Generate 0 to n-1
silence             // No output (like ~)
\`\`\`

## Style Templates

### House (4-on-floor)
\`\`\`javascript
setcps(0.5)
stack(
  s("bd*4, ~ sd ~ sd, hh*8").bank("tr909"),
  note("c2*8").s("sawtooth").lpf(300).gain(0.7),
  note("c,eb,g").s("gm_pad_warm").room(0.6).slow(2)
)
\`\`\`

### UK Garage / 2-Step (Syncopated)
\`\`\`javascript
setcps(0.583)
stack(
  s("bd*4, ~ sd ~ [sd ~], [hh hh]*8, ~ ~ oh ~").bank("tr909"),
  note("c2 ~ g1 ~").s("supersaw").lpf(180).gain(0.8).distort(2),
  note("c,eb,g").s("gm_pad_warm").room(0.5).slow(4)
)
\`\`\`

### Heavy Street Bass (808s)
\`\`\`javascript
setcps(0.583)
stack(
  s("bd*4, ~ sd ~ sd, hh*16, ~ ~ oh ~").bank("tr808").gain(1.2).distort(3),
  note("a0 [~ a0] [~ a0] a0").s("sawtooth").lpf(120).gain(0.9).distort(2),
  note("a0").s("sine").lpf(60).gain(0.7).slow(8)
)
\`\`\`

### Jazz Combo
\`\`\`javascript
setcps(0.4)
stack(
  note("c d eb f g").s("sax").room(0.6),
  note("c,e,g").s("gm_piano").room(0.3),
  note("c2*4").s("gm_acoustic_bass"),
  s("bd ~ sd ~, hh*8").gain(0.7)
)
\`\`\`

### Ambient Soundscape
\`\`\`javascript
setcps(0.2)
stack(
  note("c,e,g").s("gm_pad_warm").room(1).slow(4),
  note("c5 e5 g5").s("kalimba").room(0.8).delay(0.5).slow(2),
  note("c2").s("gm_contrabass").slow(8).gain(0.6)
)
\`\`\`

### Dark Synthwave (80s retro)
\`\`\`javascript
setcps(0.5)
stack(
  s("bd*4, ~ sd ~ sd, hh*8, ~ ~ oh ~").bank("tr808"),
  note("c1 ~ ab0 ~").s("sawtooth").lpf(150).gain(0.9).distort(1.5),
  note("c,eb,g").s("gm_pad_warm").room(0.8).slow(4).gain(0.6),
  note("<c4 eb4 f4 g4>*2").s("supersaw").lpf(600).delay(0.4)
)
\`\`\`

## Tempo Conversion

\`\`\`javascript
// Convert BPM to cycles per second:
cps = bpm / 60 / 4

// Examples:
120 BPM = 0.5 cps
140 BPM = 0.583 cps
90 BPM = 0.375 cps
\`\`\`

## Critical Rules

1. **ALWAYS start with \`setcps(NUMBER)\`** - this is required!
2. **Use \`stack()\` for multi-layered music** - this is the primary method
3. **Preserve all mini-notation operators** - never simplify patterns
4. **Return ONLY executable code** - no explanations, comments, or markdown
5. **Validate all sound names** - use sounds from the lists above
6. **Create complete patterns** - include drums, bass, harmony/melody
7. **Apply appropriate effects** - filters, reverb, delay for polish

## Common Mistakes to Avoid

1. Don't reduce \`"bd*4, ~ sd ~ sd, hh*8"\` to just \`"bd"\` - this destroys the rhythm!
2. Don't use invalid sound names - stick to the documented sounds
3. Don't forget \`setcps()\` - patterns won't play without tempo
4. Don't add explanatory text - return ONLY code
5. Don't create empty patterns - always include musical content
6. Don't over-simplify - embrace the richness of layered patterns

## Output Format

Your generated code should look exactly like this (no markdown, no comments):

\`\`\`javascript
setcps(0.5)
stack(
  s("bd*4, ~ sd ~ sd, hh*8").bank("tr909"),
  note("c2*8").s("sawtooth").lpf(300).gain(0.7),
  note("c,eb,g").s("gm_pad_warm").room(0.6).slow(2)
)
\`\`\`

Remember: YOU are generating the Strudel code. The MCP server just sends it to the browser. Make it musical, make it complete, and make it executable!
`;

/**
 * Simplified Strudel MCP Server
 *
 * This server is a SIMPLE BRIDGE between Claude Code and the browser.
 * It does NOT generate code - Claude Code generates the Strudel code directly.
 * This server just sends the code to the browser via WebSocket.
 */
class StrudelMCPServer {
  private server: Server;
  private bridgeServer: BridgeServer;

  constructor() {
    this.server = new Server(
      { name: 'strudel-mcp-server', version: '2.0.0' }
    );

    this.bridgeServer = new BridgeServer();
    this.setupHandlers();
  }

  private setupHandlers() {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.getTools() };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_pattern':
            return await this.handleExecutePattern(args);
          case 'stop_pattern':
            return await this.handleStopPattern();
          case 'get_connection_status':
            return await this.handleConnectionStatus();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'strudel://reference',
            name: 'Strudel API Reference',
            mimeType: 'text/markdown',
            description: 'Complete Strudel live coding API reference with syntax, sounds, effects, and examples'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'strudel://reference') {
        return {
          contents: [
            {
              uri: 'strudel://reference',
              mimeType: 'text/markdown',
              text: STRUDEL_REFERENCE
            }
          ]
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'execute_pattern',
        description: 'Execute raw Strudel code in the connected browser. YOU (Claude Code) generate the Strudel code - this tool just sends it to the browser. IMPORTANT: Before first use in a session, read the strudel://reference MCP resource for complete Strudel syntax and API documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Raw Strudel code to execute (e.g., "setcps(0.5)\\nstack(s(\\"bd*4\\").bank(\\"tr808\\"), note(\\"c2*4\\").s(\\"sawtooth\\"))")'
            }
          },
          required: ['code']
        }
      },
      {
        name: 'stop_pattern',
        description: 'Stop all currently playing patterns',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_connection_status',
        description: 'Check if browser is connected and ready. Tip: This is often called first - consider also reading strudel://reference resource for complete Strudel documentation.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  private async handleExecutePattern(args: any) {
    const { code } = args;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: No code provided. Please provide valid Strudel code to execute.'
          }
        ]
      };
    }

    if (!this.bridgeServer.hasConnectedClients()) {
      return {
        content: [
          {
            type: 'text',
            text: 'No browser connected. Please open strudel.cc and install/enable the browser extension.'
          }
        ]
      };
    }

    try {
      console.error(`Executing Strudel code (${code.length} chars)`);

      // Send to browser
      this.bridgeServer.sendToBrowser({
        type: 'execute_code',
        code: code
      });

      return {
        content: [
          {
            type: 'text',
            text: `Pattern sent to browser and should now be playing!\n\nExecuted code:\n\`\`\`javascript\n${code}\n\`\`\``
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to execute pattern: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleStopPattern() {
    if (!this.bridgeServer.hasConnectedClients()) {
      return {
        content: [
          {
            type: 'text',
            text: 'No browser connected.'
          }
        ]
      };
    }

    this.bridgeServer.sendToBrowser({
      type: 'stop_all'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Stopped all playing patterns.'
        }
      ]
    };
  }

  private async handleConnectionStatus() {
    const connected = this.bridgeServer.hasConnectedClients();
    const clientCount = this.bridgeServer.getClientCount();

    return {
      content: [
        {
          type: 'text',
          text: `Connection Status:\n- Browser connected: ${connected ? 'Yes' : 'No'}\n- Active connections: ${clientCount}\n- WebSocket server: Running on port 3001\n\n${connected ? 'Ready to play Strudel patterns!' : 'Please open strudel.cc and enable the browser extension.'}`
        }
      ]
    };
  }

  async start() {
    // Start WebSocket server
    await this.bridgeServer.start();
    console.error('Strudel MCP Bridge Server v2.0 started');
    console.error('WebSocket server running on port 3001');
    console.error('Open strudel.cc and install the browser extension to connect');
    console.error('');
    console.error('NOTE: This server does NOT generate code.');
    console.error('Claude Code generates the Strudel patterns directly.');
    console.error('Read STRUDEL_REFERENCE.md for the complete Strudel API.');

    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start server
const server = new StrudelMCPServer();
server.start().catch(console.error);

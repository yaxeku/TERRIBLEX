import crypto from 'crypto';

class HTMLTransformerService {
    static transformationStrategies = {
        // Original strategies
        classes: (html) => {
            const classMap = new Map();
            let classCounter = 0;
            return html.replace(/class="([^"]+)"/g, (match, classes) => {
                const newClasses = classes.split(' ').map(cls => {
                    if (!classMap.has(cls)) {
                        // Use more cryptic naming without semantic meaning
                        classMap.set(cls, `${crypto.randomBytes(3).toString('hex')}${classCounter++}`);
                    }
                    return classMap.get(cls);
                }).join(' ');
                return `class="${newClasses}"`;
            });
        },

        ids: (html) => {
            const idMap = new Map();
            let idCounter = 0;
            return html.replace(/id="([^"]+)"/g, (match, id) => {
                if (!idMap.has(id)) {
                    // Use more complex patterns for IDs similar to the other page
                    if (Math.random() > 0.5) {
                        idMap.set(id, `brt_optimising_${crypto.randomBytes(4).toString('hex')}`);
                    } else {
                        idMap.set(id, `${crypto.randomBytes(4).toString('hex')}`);
                    }
                }
                return `id="${idMap.get(id)}"`;
            });
        },

        attributes: (html) => {
            return html.replace(/<([a-zA-Z0-9]+)([^>]+)>/g, (match, tag, attrs) => {
                const attributes = attrs.trim().split(/\s+(?=[a-zA-Z-]+=)/).filter(Boolean);
                const shuffled = attributes.sort(() => crypto.randomBytes(1)[0] / 255 - 0.5);
                return `<${tag} ${shuffled.join(' ')}>`;
            });
        },

        whitespace: (html) => {
            return html.replace(/>\s+</g, () => {
                const spaces = ' '.repeat(1 + Math.floor(crypto.randomBytes(1)[0] / 255 * 3));
                const linebreaks = '\n'.repeat(1 + Math.floor(crypto.randomBytes(1)[0] / 255));
                return `>${spaces}${linebreaks}<`;
            });
        },

        comments: (html) => {
            return html.replace(/<!--[\s\S]*?-->/g, () => {
                return `<!-- ${crypto.randomBytes(4).toString('hex')} -->`;
            });
        },

        dataAttributes: (html) => {
            return html.replace(/<([a-zA-Z0-9]+)([^>]*)>/g, (match, tag, attrs) => {
                if (crypto.randomBytes(1)[0] / 255 > 0.7) {
                    const randomData = `data-v${crypto.randomBytes(4).toString('hex')}="${crypto.randomBytes(4).toString('hex')}"`;
                    return `<${tag}${attrs} ${randomData}>`;
                }
                return match;
            });
        },

        // New strategies
        
        // 1. Varying HTML structure with complex nesting
        varyStructure: (html) => {
            // Add nested divs and extra containers
            return html.replace(/<div([^>]*)>/g, (match, attrs) => {
                const random = crypto.randomBytes(1)[0] / 255;
                // Multiple tiers of randomization for more variation
                if (random > 0.85) {
                    // Complex triple nesting with role attribute
                    const roleTypes = ['region', 'group', 'presentation', 'contentinfo', 'none'];
                    const role = roleTypes[Math.floor(random * 5)];
                    return `<div${attrs}><div data-wrapper="${crypto.randomBytes(2).toString('hex')}" role="${role}"><div class="${crypto.randomBytes(3).toString('hex')}">`;
                } else if (random > 0.75) {
                    // Double nesting with span
                    return `<span data-wrapper="${crypto.randomBytes(3).toString('hex')}"><div${attrs}><div class="${crypto.randomBytes(3).toString('hex')}">`;
                } else if (random > 0.65) {
                    // Simple div wrapper
                    const innerDivClass = `inner-${crypto.randomBytes(3).toString('hex')}`;
                    return `<div${attrs}><div class="${innerDivClass}">`;
                }
                return match;
            }).replace(/<\/div>/g, (match) => {
                const random = crypto.randomBytes(1)[0] / 255;
                if (random > 0.85) {
                    return `</div></div></div>`;
                } else if (random > 0.75) {
                    return `</div></div></span>`;
                } else if (random > 0.65) {
                    return `</div></div>`;
                }
                return match;
            });
        },
        
        // 2. Adding decoy elements
        addDecoys: (html) => {
            // Insert hidden elements with random content
            return html.replace(/<\/body>/g, () => {
                const numDecoys = 3 + Math.floor(crypto.randomBytes(1)[0] / 255 * 7);
                let decoys = '';
                
                for (let i = 0; i < numDecoys; i++) {
                    const decoyType = crypto.randomBytes(1)[0] % 4;
                    const decoyId = `decoy-${crypto.randomBytes(3).toString('hex')}`;
                    
                    if (decoyType === 0) {
                        // Hidden div with random content
                        decoys += `<div id="${decoyId}" style="display:none;visibility:hidden;position:absolute;">${crypto.randomBytes(8).toString('hex')}</div>`;
                    } else if (decoyType === 1) {
                        // Comment with random data
                        decoys += `<!-- ${crypto.randomBytes(16).toString('hex')} -->`;
                    } else if (decoyType === 2) {
                        // Empty span with random attributes
                        decoys += `<span aria-hidden="true" data-decoy="${crypto.randomBytes(4).toString('hex')}" style="width:0;height:0;position:absolute;overflow:hidden;"></span>`;
                    } else {
                        // Hidden input fields similar to the other page
                        decoys += `<input type="hidden" name="hidden_${crypto.randomBytes(3).toString('hex')}" value="${crypto.randomBytes(16).toString('base64')}">`;
                    }
                }
                
                return `${decoys}</body>`;
            });
        },
        
        // 3. Varying text content slightly
        varyText: (html) => {
            // Add invisible spans or vary spacing in text
            return html.replace(/>([^<]+)</g, (match, text) => {
                // Only process text nodes with actual content
                if (text.trim()) {
                    // 30% chance to add invisible span
                    if (crypto.randomBytes(1)[0] / 255 > 0.7) {
                        const invisibleSpan = `<span style="font-size:0;width:0;height:0;position:absolute;">${crypto.randomBytes(3).toString('hex')}</span>`;
                        const insertPos = Math.floor(crypto.randomBytes(1)[0] / 255 * text.length);
                        const modifiedText = text.slice(0, insertPos) + invisibleSpan + text.slice(insertPos);
                        return `>${modifiedText}<`;
                    }
                    
                    // 20% chance to wrap text in inner spans (like the other page does)
                    if (crypto.randomBytes(1)[0] / 255 > 0.8) {
                        const innerClass = `innerclass ${crypto.randomBytes(4).toString('hex')}`;
                        return `><span class="${innerClass}">${text}</span><`;
                    }
                    
                    // 15% chance to vary whitespace
                    if (crypto.randomBytes(1)[0] / 255 > 0.85) {
                        const words = text.split(' ');
                        if (words.length > 1) {
                            // Insert zero-width space (&#8203;) or hair space (&#8202;)
                            const spacedWords = words.map((word, i) => {
                                if (i < words.length - 1 && crypto.randomBytes(1)[0] / 255 > 0.5) {
                                    const space = crypto.randomBytes(1)[0] % 2 === 0 ? '&#8203;' : '&#8202;';
                                    return word + space;
                                }
                                return word;
                            });
                            return `>${spacedWords.join(' ')}<`;
                        }
                    }
                }
                return match;
            });
        },
        
        // 4. Add honeypot fields (if not already present)
        addHoneypots: (html) => {
            if (!html.includes('name="csrf_token"')) {
                return html.replace(/<body([^>]*)>/g, (match, attrs) => {
                    const honeypots = `
    <input type="hidden" name="csrf_token" value="${crypto.randomBytes(32).toString('base64')}">
    <input type="hidden" name="csrf__secondary_token" value="2nd_${crypto.randomBytes(32).toString('base64')}_nd2">
    <input type="hidden" name="csrf_name" value="constant_form_validator">
    <input type="hidden" id="brutal-detector" value="${crypto.randomBytes(24).toString('base64')}">
    <ul id="tests" style="display:none;">
        <li>scroll: ${Math.random() > 0.5 ? 'true' : 'undefined'}</li>
        <li>mousemove: ${Math.random() > 0.7 ? 'true' : 'false'}</li>
        <li>keyup: true</li>
        <li>touchstart: ${Math.random() > 0.5 ? 'undefined' : 'true'}</li>
        <li>devicemotion: ${Math.random() > 0.5 ? 'false' : 'undefined'}</li>
    </ul>`;
                    return `<body${attrs}>${honeypots}`;
                });
            }
            return html;
        },
        
        // 5. Add role attributes (accessibility attributes used by the other page)
        addRoles: (html) => {
            return html.replace(/<div([^>]*)>/g, (match, attrs) => {
                if (!attrs.includes('role=') && crypto.randomBytes(1)[0] / 255 > 0.8) {
                    const roles = ['main', 'contentinfo', 'presentation', 'region', 'group'];
                    const role = roles[Math.floor(crypto.randomBytes(1)[0] / 255 * roles.length)];
                    return `<div${attrs} role="${role}">`;
                }
                return match;
            });
        },
        
        // 6. Add cryptic IDs to elements (without semantic meaning)
        addCrypticIds: (html) => {
            return html.replace(/<(div|span)([^>]*)>/g, (match, tag, attrs) => {
                if (!attrs.includes('id=') && crypto.randomBytes(1)[0] / 255 > 0.7) {
                    const crypticId = `brt_optimising_${crypto.randomBytes(4).toString('hex')}`;
                    return `<${tag}${attrs} id="${crypticId}">`;
                }
                return match;
            });
        }
    };

    static async transformHTML(html) {
        // Apply transformations with varying probability
        const strategies = Object.values(this.transformationStrategies);
        const shuffledStrategies = strategies.sort(() => crypto.randomBytes(1)[0] / 255 - 0.5);

        let transformedHtml = html;
        for (const strategy of shuffledStrategies) {
            // Only apply each strategy with 85% probability for more variation
            if (crypto.randomBytes(1)[0] / 255 > 0.15) {
                transformedHtml = strategy(transformedHtml);
            }
        }

        // Add security headers and nonce for scripts
        const nonce = crypto.randomBytes(8).toString('hex');
        transformedHtml = transformedHtml.replace(/<script/g, `<script nonce="${nonce}"`);

        // Add random metadata
        const metaTagCount = 1 + Math.floor(crypto.randomBytes(1)[0] / 255 * 4);
        const metaTags = [];
        for (let i = 0; i < metaTagCount; i++) {
            metaTags.push(`<meta name="v${crypto.randomBytes(4).toString('hex')}" content="${crypto.randomBytes(4).toString('hex')}">`);
        }
        metaTags.push(`<meta name="t${crypto.randomBytes(3).toString('hex')}" content="${Date.now()}">`);
        transformedHtml = transformedHtml.replace('</head>', `${metaTags.join('\n')}\n</head>`);
        
        // Add a few random HTML comments
        const commentPositions = ['<!DOCTYPE html>', '<head>', '<body>', '</div>'];
        for (const position of commentPositions) {
            if (crypto.randomBytes(1)[0] / 255 > 0.4 && transformedHtml.includes(position)) {
                const randomComment = `<!-- ${crypto.randomBytes(8).toString('hex')} -->`;
                transformedHtml = transformedHtml.replace(position, `${position}\n${randomComment}`);
            }
        }
        
        // Add meta refresh tag occasionally
        if (crypto.randomBytes(1)[0] / 255 > 0.7 && !transformedHtml.includes('http-equiv="refresh"')) {
            const refreshTime = 120 + Math.floor(crypto.randomBytes(1)[0] / 255 * 240);
            const refreshTag = `<meta http-equiv="refresh" content="${refreshTime}">`;
            transformedHtml = transformedHtml.replace('</head>', `${refreshTag}\n</head>`);
        }

        return { transformedHtml, nonce };
    }

    static createSessionIdentifier() {
        return crypto.randomBytes(16).toString('hex');
    }
}

export default HTMLTransformerService;
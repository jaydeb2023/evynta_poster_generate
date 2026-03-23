/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { 
  Leaf, 
  Sparkles, 
  Download, 
  Share2, 
  RefreshCw, 
  Image as ImageIcon,
  ShoppingBag,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Layers,
  Layout,
  Palette,
  Type as TypeIcon,
  Info
} from "lucide-react";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface PosterDesign {
  title: string;
  style: string;
  colorTheme: string;
  headline: string;
  fullText: string;
  layoutDescription: string;
  visualDescription: string;
  ctaPlacement: string;
  whyItConverts: string;
  imageUrl?: string;
}

interface PosterConfig {
  type: 'product' | 'event' | 'service';
  category: 'Real Estate' | 'Healthcare' | 'E-commerce' | 'Finance' | 'Fitness' | 'Restaurant' | 'Technology' | 'Dental Clinic' | 'General';
  service: 'AI Agent' | 'Chatbot' | 'Automation' | 'CRM' | 'Web Solutions' | 'Data Solutions' | 'None';
  product: string;
  headline: string;
  offer: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  style: 'minimal' | 'rustic' | 'modern' | 'vibrant' | 'tech' | 'premium' | 'random';
  logo?: string;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState<PosterDesign[]>([]);
  const [config, setConfig] = useState<PosterConfig>({
    type: 'service',
    category: 'Real Estate',
    service: 'AI Agent',
    product: 'Smart Solutions',
    headline: 'Close more deals with Evynta AI Agents & CRM!',
    offer: 'Free AI Consultation for Realtors',
    eventName: 'Tech Summit 2026',
    eventDate: 'November 20th',
    eventLocation: 'Silicon Valley',
    style: 'premium'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePoster = async () => {
    setLoading(true);
    setDesigns([]);
    try {
      // Step 1: Generate 3 Design Concepts using Text Model
      const conceptPrompt = `You are a professional AI graphic designer creating 3 COMPLETELY DIFFERENT marketing poster designs for the brand "Evynta" (AI, Web & Data Solutions).

INPUTS:
Industry: ${config.category}
Service: ${config.service}
Style Preference: ${config.style}

ABOUT BRAND:
Evynta is a premium AI, Web, and Data solutions company that helps businesses automate processes, generate leads, and close more deals using AI agents and CRM systems.

GOAL:
Create visually stunning, high-converting Instagram-style posters that look like they were designed by a top agency.

IMPORTANT RULES:
* Each of the 3 designs must be COMPLETELY UNIQUE
* Do NOT repeat layout, colors, or composition
* Each design should feel like a different designer made it
* Use different angles, placements, and visual hierarchy

RANDOMIZE FOR EACH DESIGN (if style is random):
* Layout (left/right/center/grid/split)
* Color scheme (dark, light, gradient, gold, neon, corporate)
* Background (office, tech, abstract, real-world, minimal)
* Typography style (bold, elegant, modern, minimal)
* Visual elements (icons, overlays, UI mockups, shapes)

CONTENT:
* Brand Name: Evynta
* Headline: ${config.headline || 'Generate a strong, catchy headline based on the selected service'}
* Subheadline: Explain benefit clearly
* Features:
  • Instantly Qualify Leads
  • Automate Follow-Ups
  • Book Appointments Automatically
  • Increase Conversions
* CTA: "${config.offer || 'Free AI Consultation'}"
* Website: www.evynta.in

INDUSTRY CUSTOMIZATION:
Adjust visuals and messaging based on industry:
* Real Estate → buildings, agents, luxury lifestyle
* Healthcare → trust, doctors, clean environment
* E-commerce → products, shopping, offers
* Finance → growth, charts, professionalism
* Fitness → energy, transformation
* Restaurant → food visuals, warm tones
* Technology → AI, dashboards, futuristic UI

Return the 3 designs in a JSON array. Each object must have:
1. title
2. style
3. colorTheme
4. headline
5. fullText
6. layoutDescription
7. visualDescription
8. ctaPlacement
9. whyItConverts`;

      const conceptResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: conceptPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                style: { type: Type.STRING },
                colorTheme: { type: Type.STRING },
                headline: { type: Type.STRING },
                fullText: { type: Type.STRING },
                layoutDescription: { type: Type.STRING },
                visualDescription: { type: Type.STRING },
                ctaPlacement: { type: Type.STRING },
                whyItConverts: { type: Type.STRING },
              },
              required: ['title', 'style', 'colorTheme', 'headline', 'fullText', 'layoutDescription', 'visualDescription', 'ctaPlacement', 'whyItConverts']
            }
          }
        }
      });

      const designConcepts: PosterDesign[] = JSON.parse(conceptResponse.text);
      
      // Step 2: Generate Images for each concept
      const finalDesigns: PosterDesign[] = [];

      for (const concept of designConcepts) {
        let imagePrompt = `Create a professional, high-end, realistic social media poster for "Evynta".
        DESIGN TITLE: ${concept.title}
        STYLE: ${concept.style}
        COLOR THEME: ${concept.colorTheme}
        LAYOUT: ${concept.layoutDescription}
        VISUALS: ${concept.visualDescription}
        HEADLINE: "${concept.headline}"
        TEXT CONTENT: "${concept.fullText}"
        CTA: "${concept.ctaPlacement}"
        
        The company name "Evynta" and website "evynta.in" must be visible. 
        Ensure a premium, agency-level quality. 
        Industry context: ${config.category}.`;

        const contents: any[] = [{ text: imagePrompt }];
        
        if (config.logo) {
          const base64Data = config.logo.split(',')[1];
          contents.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Data
            }
          });
          imagePrompt += " Use the provided logo for branding.";
        }

        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: contents },
          config: {
            imageConfig: {
              aspectRatio: "9:16"
            }
          }
        });

        if (imageResponse.candidates?.[0]?.content?.parts) {
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              concept.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        finalDesigns.push(concept);
        // Update state incrementally to show progress
        setDesigns([...finalDesigns]);
      }

    } catch (error) {
      console.error("Error generating posters:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Controls */}
      <aside className="w-full md:w-96 bg-white p-8 border-r border-organic-green/10 flex flex-col gap-8 overflow-y-auto">
        <div className="flex items-center gap-2 text-organic-green">
          <Leaf className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">EvyntaAI</h1>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Company Logo</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 border-2 border-dashed border-organic-green/20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-organic-green/5 transition-all overflow-hidden"
          >
            {config.logo ? (
              <img src={config.logo} alt="Logo" className="h-full w-full object-contain p-2" />
            ) : (
              <>
                <ImageIcon className="w-5 h-5 text-organic-green/40" />
                <span className="text-[10px] text-organic-green/60">Click to upload logo</span>
              </>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLogoUpload} 
            className="hidden" 
            accept="image/*" 
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-organic-cream rounded-xl">
          <button 
            onClick={() => setConfig({...config, type: 'service'})}
            className={`flex-1 py-1 text-sm font-medium rounded-lg transition-all ${config.type === 'service' ? 'bg-white shadow-sm text-organic-green' : 'text-organic-earth/50 hover:text-organic-earth'}`}
          >
            Service
          </button>
          <button 
            onClick={() => setConfig({...config, type: 'product'})}
            className={`flex-1 py-1 text-sm font-medium rounded-lg transition-all ${config.type === 'product' ? 'bg-white shadow-sm text-organic-green' : 'text-organic-earth/50 hover:text-organic-earth'}`}
          >
            Product
          </button>
          <button 
            onClick={() => setConfig({...config, type: 'event'})}
            className={`flex-1 py-1 text-sm font-medium rounded-lg transition-all ${config.type === 'event' ? 'bg-white shadow-sm text-organic-green' : 'text-organic-earth/50 hover:text-organic-earth'}`}
          >
            Event
          </button>
        </div>

        <div className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Industry Category</label>
            <select 
              className="organic-input w-full text-sm"
              value={config.category}
              onChange={(e) => setConfig({...config, category: e.target.value as any})}
            >
              <option value="General">General Business</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Healthcare">Healthcare</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Finance">Finance</option>
              <option value="Fitness">Fitness</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Technology">Technology</option>
              <option value="Dental Clinic">Dental Clinic</option>
            </select>
          </div>

          {config.type === 'service' && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Service Type</label>
              <select 
                className="organic-input w-full text-sm"
                value={config.service}
                onChange={(e) => setConfig({...config, service: e.target.value as any})}
              >
                <option value="AI Agent">AI Agent</option>
                <option value="Chatbot">Chatbot</option>
                <option value="Automation">Automation</option>
                <option value="CRM">CRM</option>
                <option value="Web Solutions">Web Solutions</option>
                <option value="Data Solutions">Data Solutions</option>
              </select>
            </div>
          )}

          {config.type === 'product' && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Product Name</label>
              <input 
                type="text" 
                className="organic-input w-full"
                value={config.product}
                onChange={(e) => setConfig({...config, product: e.target.value})}
                placeholder="e.g. Smart Dashboard"
              />
            </div>
          )}

          {config.type === 'event' && (
            <>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Event Name</label>
                <input 
                  type="text" 
                  className="organic-input w-full"
                  value={config.eventName}
                  onChange={(e) => setConfig({...config, eventName: e.target.value})}
                  placeholder="e.g. Tech Expo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Date & Location</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    className="organic-input w-full text-xs"
                    value={config.eventDate}
                    onChange={(e) => setConfig({...config, eventDate: e.target.value})}
                    placeholder="Date"
                  />
                  <input 
                    type="text" 
                    className="organic-input w-full text-xs"
                    value={config.eventLocation}
                    onChange={(e) => setConfig({...config, eventLocation: e.target.value})}
                    placeholder="Location"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Headline</label>
            <textarea 
              className="organic-input w-full h-20 resize-none text-sm"
              value={config.headline}
              onChange={(e) => setConfig({...config, headline: e.target.value})}
              placeholder="e.g. Close more deals..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Offer / CTA</label>
            <input 
              type="text" 
              className="organic-input w-full"
              value={config.offer}
              onChange={(e) => setConfig({...config, offer: e.target.value})}
              placeholder="e.g. Get Started Today"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-semibold opacity-50">Visual Style</label>
            <div className="grid grid-cols-3 gap-1">
              {(['minimal', 'rustic', 'modern', 'vibrant', 'tech', 'premium', 'random'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({...config, style: s})}
                  className={`px-2 py-1.5 rounded-lg text-[10px] capitalize transition-all ${
                    config.style === s 
                      ? 'bg-organic-green text-white' 
                      : 'bg-organic-cream text-organic-earth hover:bg-organic-green/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={generatePoster}
            disabled={loading}
            className="organic-button w-full flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Designing 3 Concepts...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate 3 Designs
              </>
            )}
          </button>
        </div>

        <div className="mt-auto pt-8 border-t border-organic-green/5">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-organic-cream/50">
            <ShoppingBag className="w-5 h-5 text-organic-green" />
            <div>
              <p className="text-xs font-semibold opacity-50">E-commerce Ready</p>
              <p className="text-sm">Optimized for conversion</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 bg-organic-cream p-4 md:p-12 flex flex-col items-center relative overflow-y-auto">
        {/* Decorative Background Elements */}
        <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-organic-green/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-10%] w-96 h-96 bg-organic-green/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl w-full space-y-12 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-4xl md:text-5xl font-serif italic">Design Showcase</h2>
            <p className="text-organic-earth/60">3 unique, high-converting marketing posters for Evynta</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <AnimatePresence mode="popLayout">
              {designs.length > 0 ? (
                designs.map((design, index) => (
                  <motion.div
                    key={design.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Poster Image */}
                    <div className="aspect-[9/16] w-full glass-card rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group relative">
                      {design.imageUrl ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={design.imageUrl} 
                            alt={design.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => downloadImage(design.imageUrl!, design.title)}
                              className="p-4 bg-white rounded-full text-organic-earth hover:bg-organic-green hover:text-white transition-colors"
                              title="Download Poster"
                            >
                              <Download className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-organic-green/30">
                          <Loader2 className="w-12 h-12 animate-spin" />
                          <p className="font-serif italic">Rendering Design {index + 1}...</p>
                        </div>
                      )}
                    </div>

                    {/* Design Metadata */}
                    <div className="space-y-4 p-6 glass-card rounded-3xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-organic-green">{design.title}</h3>
                        <span className="px-3 py-1 bg-organic-green/10 text-organic-green rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {design.style}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div className="flex items-center gap-2 opacity-70">
                          <Palette className="w-3 h-3" />
                          <span>{design.colorTheme}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-70">
                          <Layout className="w-3 h-3" />
                          <span>{design.ctaPlacement}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-organic-green">
                          <TypeIcon className="w-3 h-3" />
                          <span>Headline</span>
                        </div>
                        <p className="text-sm font-medium italic">"{design.headline}"</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-organic-green">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Why it Converts</span>
                        </div>
                        <div className="text-xs opacity-80 leading-relaxed">
                          <ReactMarkdown>{design.whyItConverts}</ReactMarkdown>
                        </div>
                      </div>

                      <button 
                        onClick={() => downloadImage(design.imageUrl!, design.title)}
                        disabled={!design.imageUrl}
                        className="w-full py-2 rounded-xl border border-organic-green/20 text-organic-green text-xs font-bold hover:bg-organic-green hover:text-white transition-all disabled:opacity-30"
                      >
                        Download This Design
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                !loading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-24 text-organic-green/20">
                    <ImageIcon className="w-32 h-32 mb-4" strokeWidth={0.5} />
                    <p className="text-2xl font-serif italic">Generate 3 unique designs to start</p>
                  </div>
                )
              )}
            </AnimatePresence>
          </div>

          {loading && designs.length < 3 && (
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="relative">
                <RefreshCw className="w-16 h-16 text-organic-green animate-spin" />
                <Sparkles className="w-8 h-8 text-organic-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-serif italic text-2xl text-organic-green">Evynta AI is crafting your posters...</p>
                <p className="text-sm opacity-50">This may take a minute as we generate 3 unique concepts and high-res images.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-xs text-organic-earth/40 flex items-center gap-4">
          <span>Powered by Gemini 2.5 Flash</span>
          <div className="w-1 h-1 bg-organic-earth/20 rounded-full" />
          <span>Realistic Organic Rendering</span>
          <div className="w-1 h-1 bg-organic-earth/20 rounded-full" />
          <span>E-commerce Optimized</span>
        </div>
      </main>
    </div>
  );
}

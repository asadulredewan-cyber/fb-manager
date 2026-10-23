import * as Gemini from "../lib/gemini.js";
import { verifyAdmin } from "./auth/verify-admin.js";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({success:false,error:"Method not allowed"});
 if(!await verifyAdmin(req,res))return;
 try{const text=String(req.body?.text||"").trim(),type=req.body?.type==="comment"?"Facebook comment":"Facebook Messenger message";if(!text)return res.status(400).json({success:false,error:"Message text is required"});if(text.length>5000)return res.status(413).json({success:false,error:"Text is too long"});
 const fn=Gemini.generateText||Gemini.generateContent||Gemini.generateCaption||Gemini.default;if(!fn)throw Error("Gemini text-generation function is not available");
 const prompt=`Write a short, respectful reply draft for this ${type}. Use the same language as the sender, but only Bengali or English. If the language is unknown/unsupported, the message is abusive, toxic, threatening, spam, or unclear, return exactly FLAG. Do not invent prices, stock, delivery details, or business policies. Return only the reply text.\nInput: ${JSON.stringify(text)}`;
 const out=await fn(prompt,{model:process.env.GEMINI_MODEL||"gemini-2.5-flash"});const reply=(typeof out==="string"?out:(out.text||out.response?.text||out.candidates?.[0]?.content?.parts?.map(p=>p.text).join("")||"")).trim();if(!reply||reply.toUpperCase()==="FLAG")return res.status(422).json({success:false,flagged:true,error:"AI did not draft a reply. This item needs manual review."});return res.status(200).json({success:true,data:{reply}});
 }catch(e){console.error("AI draft error",e.message);return res.status(500).json({success:false,error:"Could not generate an AI reply"});}}

/* Overlay approved public records onto the original The Team directory. */
(function(){'use strict';
let cached=null,inflight=null;
async function getProfiles(){if(cached)return cached;if(!inflight)inflight=(async()=>{const db=window.ACLabTeamDB.client();const {data,error}=await db.from('aclab_published_team_members').select('member_id,profile,published_at').order('published_at',{ascending:true});if(error)throw error;cached=data||[];return cached;})().finally(()=>{inflight=null;});return inflight;}
async function merge(config){if(!config||!Array.isArray(config.members))return;try{const rows=await getProfiles();for(const row of rows){const item=row.profile;if(!item||!item.id)continue;const idx=config.members.findIndex(p=>p.id===item.id);if(idx>=0){const existing=config.members[idx];config.members[idx]={...existing,...item,order:existing.order,photo:item.photo||existing.photo,photoPosition:item.photo?item.photoPosition:existing.photoPosition,photoZoom:item.photo?item.photoZoom:existing.photoZoom};}else{config.members.push({...item,order:Math.max(100, ...config.members.map(x=>Number(x.order)||0))+1});}}}catch(err){console.warn('Approved team member overlay unavailable:',err.message);}}
window.ACLabPublicTeam={merge};
})();

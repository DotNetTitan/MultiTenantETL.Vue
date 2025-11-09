const c=["OrderId","CustomerId","OrderDate","TotalAmount","Status","customer_id","first_name","last_name","email","phone","id","product_code","quantity","price","last_updated"],l=["Filter","Map","Script","Trim","Case Convert","Substring","Replace"],i={name_asc:(t,e)=>t.name.localeCompare(e.name),name_desc:(t,e)=>e.name.localeCompare(t.name),type_asc:(t,e)=>t.type.localeCompare(e.type),created_desc:(t,e)=>new Date(e.createdAt)-new Date(t.createdAt),created_asc:(t,e)=>new Date(t.createdAt)-new Date(e.createdAt)},o=[{id:"1",name:"Equals Filter",type:"Filter",description:"Filter rows where a field equals a specific value",createdAt:new Date(Date.now()-30*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Sales Data ETL","Customer Import"],config:{operator:"equals",valueType:"string",defaultValue:"Completed"}},{id:"2",name:"High Value Filter",type:"Filter",description:"Filter rows where a numeric field is greater than 1000",createdAt:new Date(Date.now()-28*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{operator:"greaterThan",valueType:"number",defaultValue:"1000"}},{id:"3",name:"Status Code Mapper",type:"Map",description:"Maps single-letter status codes to full names",createdAt:new Date(Date.now()-25*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Sales Data ETL"],config:{mappings:[{from:"P",to:"Pending"},{from:"C",to:"Completed"},{from:"X",to:"Cancelled"},{from:"R",to:"Refunded"}]}},{id:"6",name:"Phone Number Formatter",type:"Script",description:"Formats phone numbers to (XXX) XXX-XXXX pattern",createdAt:new Date(Date.now()-15*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Customer Import"],config:{scriptLanguage:"javascript",script:`// Format phone numbers to (XXX) XXX-XXXX
if (row.phone) {
  let digits = row.phone.replace(/\\D/g, '');
  if (digits.length === 10) {
    row.phone = \`(\${digits.substring(0, 3)}) \${digits.substring(3, 6)}-\${digits.substring(6)}\`;
  }
}
return row;`}},{id:"7",name:"Calculate Total Value",type:"Script",description:"Multiplies quantity by price to get total value",createdAt:new Date(Date.now()-10*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Product Sync"],config:{scriptLanguage:"javascript",script:`// Calculate total value
if (row.quantity && row.price) {
  row.total_value = row.quantity * row.price;
}
return row;`}},{id:"8",name:"Trim Whitespace",type:"Script",description:"Removes leading and trailing spaces from text fields",createdAt:new Date(Date.now()-5*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{scriptLanguage:"javascript",script:`// Trim whitespace from text fields
if (typeof row.field_name === 'string') {
  row.field_name = row.field_name.trim();
}
return row;`}},{id:"9",name:"Data Validation (C#)",type:"Script",description:"Validates and cleans data using C# with better performance",createdAt:new Date(Date.now()-3*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{scriptLanguage:"csharp",script:`// Validate and clean data
if (row.ContainsKey("email") && row["email"] != null)
{
    var email = row["email"].ToString();
    if (!email.Contains("@"))
    {
        row["email_valid"] = false;
    }
    else
    {
        row["email_valid"] = true;
        row["email"] = email.ToLower().Trim();
    }
}
return row;`}},{id:"10",name:"Complex Calculation (C#)",type:"Script",description:"Performs complex calculations with C# for better performance",createdAt:new Date(Date.now()-2*24*60*60*1e3).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{scriptLanguage:"csharp",script:`// Complex business logic
if (row.ContainsKey("quantity") && row.ContainsKey("price"))
{
    var quantity = Convert.ToDecimal(row["quantity"]);
    var price = Convert.ToDecimal(row["price"]);
    
    // Calculate with discount tiers
    var total = quantity * price;
    if (total > 1000) total *= 0.9m;  // 10% discount
    else if (total > 500) total *= 0.95m;  // 5% discount
    
    row["total_with_discount"] = Math.Round(total, 2);
}
return row;`}}],u={async getAll(t={}){await new Promise(a=>setTimeout(a,500));let e=[...o];if(t.search){const a=t.search.toLowerCase();e=e.filter(n=>{var r;return n.name.toLowerCase().includes(a)||((r=n.description)==null?void 0:r.toLowerCase().includes(a))})}return t.type&&t.type!=="All"&&(e=e.filter(a=>a.type===t.type)),t.sort&&i[t.sort]&&e.sort(i[t.sort]),e},async getById(t){await new Promise(a=>setTimeout(a,300));const e=o.find(a=>a.id===t);if(!e){const a=new Error("Transformation not found");throw a.response={status:404},a}return{...e}},async create(t){await new Promise(a=>setTimeout(a,800));const e={...t,id:Math.random().toString(36).substring(2,15),createdAt:new Date().toISOString()};return o.push(e),{...e}},async update(t,e){await new Promise(r=>setTimeout(r,600));const a=o.findIndex(r=>r.id===t);if(a===-1){const r=new Error("Transformation not found");throw r.response={status:404},r}const n={...o[a],...e};return o[a]=n,{...n}},async delete(t){await new Promise(a=>setTimeout(a,400));const e=o.findIndex(a=>a.id===t);if(e===-1){const a=new Error("Transformation not found");throw a.response={status:404},a}return o.splice(e,1),!0},async clone(t){const e={...t,id:null,name:`Copy of ${t.name}`};return this.create(e)},getAvailableColumns(){return c},getTransformationTypes(){return l},createEmpty(){return{id:null,name:"",type:"Filter",description:"",config:{}}},formatDate(t){return t?new Date(t).toLocaleString():"-"},getTypeColor(t){switch(t){case"Filter":return"indigo";case"Map":return"teal";case"Script":return"orange";case"Trim":return"cyan";case"Case Convert":return"blue";case"Substring":return"pink";case"Replace":return"amber";default:return"blue"}},applyFilters(t,e={}){let a=[...t];if(e.search){const n=e.search.toLowerCase();a=a.filter(r=>{var s;return r.name.toLowerCase().includes(n)||((s=r.description)==null?void 0:s.toLowerCase().includes(n))})}return e.type&&e.type!=="All"&&(a=a.filter(n=>n.type===e.type)),e.sort&&i[e.sort]&&a.sort(i[e.sort]),a}},d=t=>u.getAll(t);export{d as f,u as t};

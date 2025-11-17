const e=[{id:"1",name:"Equals Filter",type:"Filter",description:"Filter rows where a field equals a specific value",createdAt:new Date(Date.now()-2592e6).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Sales Data ETL","Customer Import"],config:{operator:"equals",valueType:"string",defaultValue:"Completed"}},{id:"2",name:"High Value Filter",type:"Filter",description:"Filter rows where a numeric field is greater than 1000",createdAt:new Date(Date.now()-24192e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{operator:"greaterThan",valueType:"number",defaultValue:"1000"}},{id:"3",name:"Status Code Mapper",type:"Map",description:"Maps single-letter status codes to full names",createdAt:new Date(Date.now()-216e7).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Sales Data ETL"],config:{mappings:[{from:"P",to:"Pending"},{from:"C",to:"Completed"},{from:"X",to:"Cancelled"},{from:"R",to:"Refunded"}]}},{id:"4",name:"Trim Text Fields",type:"Trim",description:"Remove leading and trailing whitespace from text fields",createdAt:new Date(Date.now()-19008e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Sales Data ETL"],config:{fields:["Status","CustomerName"]}},{id:"5",name:"Uppercase Product Codes",type:"Case Convert",description:"Convert product codes to uppercase for consistency",createdAt:new Date(Date.now()-15552e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Product Sync"],config:{field:"product_code",caseType:"uppercase"}},{id:"6",name:"Phone Number Formatter",type:"Script",description:"Formats phone numbers to (XXX) XXX-XXXX pattern",createdAt:new Date(Date.now()-1296e6).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Customer Import"],config:{scriptLanguage:"javascript",script:`// Format phone numbers to (XXX) XXX-XXXX
if (row.phone) {
  let digits = row.phone.replace(/\\D/g, '');
  if (digits.length === 10) {
    row.phone = \`(\${digits.substring(0, 3)}) \${digits.substring(3, 6)}-\${digits.substring(6)}\`;
  }
}
return row;`}},{id:"7",name:"Calculate Total Value",type:"Script",description:"Multiplies quantity by price to get total value",createdAt:new Date(Date.now()-864e6).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:["Product Sync"],config:{scriptLanguage:"javascript",script:`// Calculate total value
if (row.quantity && row.price) {
  row.total_value = row.quantity * row.price;
}
return row;`}},{id:"8",name:"Trim Whitespace",type:"Script",description:"Removes leading and trailing spaces from text fields",createdAt:new Date(Date.now()-432e6).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{scriptLanguage:"javascript",script:`// Trim whitespace from text fields
if (typeof row.field_name === 'string') {
  row.field_name = row.field_name.trim();
}
return row;`}},{id:"9",name:"Data Validation (C#)",type:"Script",description:"Validates and cleans data using C# with better performance",createdAt:new Date(Date.now()-2592e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{scriptLanguage:"csharp",script:`// Validate and clean data
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
return row;`}},{id:"10",name:"Complex Calculation (C#)",type:"Script",description:"Performs complex calculations with C# for better performance",createdAt:new Date(Date.now()-1728e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{scriptLanguage:"csharp",script:`// Complex business logic
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
return row;`}},{id:"11",name:"Extract Year from Date",type:"Substring",description:"Extract year portion from date fields",createdAt:new Date(Date.now()-10368e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{field:"OrderDate",startIndex:0,length:4}},{id:"12",name:"Replace Null Values",type:"Replace",description:"Replace null or empty values with default text",createdAt:new Date(Date.now()-6912e5).toISOString(),dataSourceId:null,dataSourceName:null,usedInPipelines:[],config:{field:"phone",findPattern:"^$",replaceWith:"N/A",useRegex:!0}}];export{e as m};

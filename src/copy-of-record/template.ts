export const copyOfRecordTemplate = `
<!DOCTYPE html>
<html>

  <style>
    h1 {text-align: center}
    h2 {background-color: #005ea2; color: white; padding: 5px; font-weight: 400; font-size: 40px} 
    .code-section {border-top: 1px solid grey; padding:20px}
    .code-group { flex: 0 1 auto; width: 25%; font-weight: 700; padding-right: 0.5rem }
    .code-values { flex: 0 1 auto; width: 75% }
    .col-table-container {display: flex; width: 100%}
    .col-table {flex: 0 1 auto; width: 25%}
    body {margin: 25px}
    table { font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%; } 
    table td, table th { border: 1px solid #ddd; padding: 8px; } 
    table tr:nth-child(even){background-color: #f2f2f2;} 
    table th { padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: white; color: black; } 
    a{padding: 5px; border-left: .5rem solid; font-size: 1.06rem; line-height: 1.5;}
    h3{margin-top: 25px;}
  </style>

  <body>
    <h1> {HEADER} </h1>
    <h3> {DATE} </h3>
    {CONTENT}
  </body>
</html>
`;

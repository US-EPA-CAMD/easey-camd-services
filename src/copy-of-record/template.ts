export const copyOfRecordTemplate = `
<!DOCTYPE html>
<html>

  <style>
    h1 {text-align: center}
    h3 {background-color: #005ea2; color: white; padding: 5px;} 
    hr {
      border-top:4px dotted #000;
    }
    .test-header {background-color: #000000;}
    .code-section {border-top: 1px solid grey; padding:20px}
    .code-group { flex: 0 1 auto; width: 25%; font-weight: 700; padding-right: 0.5rem }
    .code-values { flex: 0 1 auto; width: 75% }
    .col-table-container {display: flex; width: 100%}
    .col-table {flex: 0 1 auto; width: 25%}
    .large-table{font-size: 1.5vw}
    .larger-table{font-size: 1.2vw}
    .largest-table{font-size: .8vw}    
    table { font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%; } 
    table td, table th { border: 1px solid #ddd; padding: 8px; } 
    a{padding: 5px; border-left: .5rem solid; font-size: 1.06rem; line-height: 1.5;}
    h3{margin-top: 25px;}
  </style>

  <body>
    <h1> {HEADER} </h1>
   <b>{DATE}</b>
   {CONTENT}
  </body>
</html>
`;

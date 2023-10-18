export const certTemplate = `
<!DOCTYPE html>
<html>

  <style>
    h1 {text-align: center}
    hr {
      border-top:4px dotted #000;
    }
    p {
      margin-left: auto;
      margin-right: auto;
      text-align: center;
    }
  </style>

  <body>
   <h1> {HEADER} </h1>
   <b>{DATE}</b>
   {CONTENT}
  </body>
</html>
`;

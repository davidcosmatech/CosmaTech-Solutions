const fs = require('fs');
const path = require('path');

function updateHtmlFiles(dir, prefix) {
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Update from v=1.1 to v=1.2
      let modified = false;
      
      const targetAuth = prefix ? `<script src="${prefix}js/auth.js?v=1.1"></script>` : `<script src="js/auth.js?v=1.1"></script>`;
      const replacementAuth = prefix ? `<script src="${prefix}js/auth.js?v=1.2"></script>` : `<script src="js/auth.js?v=1.2"></script>`;
      
      const targetMain = prefix ? `<script src="${prefix}js/main.js?v=1.1"></script>` : `<script src="js/main.js?v=1.1"></script>`;
      const replacementMain = prefix ? `<script src="${prefix}js/main.js?v=1.2"></script>` : `<script src="js/main.js?v=1.2"></script>`;
      
      const targetCss = prefix ? `<link rel="stylesheet" href="${prefix}css/style.css?v=1.1">` : `<link rel="stylesheet" href="css/style.css?v=1.1">`;
      const replacementCss = prefix ? `<link rel="stylesheet" href="${prefix}css/style.css?v=1.2">` : `<link rel="stylesheet" href="css/style.css?v=1.2">`;
      
      if (content.includes(targetAuth)) {
        content = content.replace(targetAuth, replacementAuth);
        modified = true;
      }
      if (content.includes(targetMain)) {
        content = content.replace(targetMain, replacementMain);
        modified = true;
      }
      if (content.includes(targetCss)) {
        content = content.replace(targetCss, replacementCss);
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated cache buster to 1.2: ${filePath}`);
      }
    }
  });
}

updateHtmlFiles('.', '');
updateHtmlFiles('./ro', '../');

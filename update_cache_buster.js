const fs = require('fs');
const path = require('path');

function updateHtmlFiles(dir, prefix) {
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      const targetAuth = prefix ? `<script src="${prefix}js/auth.js"></script>` : `<script src="js/auth.js"></script>`;
      const targetMain = prefix ? `<script src="${prefix}js/main.js"></script>` : `<script src="js/main.js"></script>`;

      const replacementAuth = prefix ? `<script src="${prefix}js/auth.js?v=1.1"></script>` : `<script src="js/auth.js?v=1.1"></script>`;
      const replacementMain = prefix ? `<script src="${prefix}js/main.js?v=1.1"></script>` : `<script src="js/main.js?v=1.1"></script>`;

      let modified = false;
      if (content.includes(targetAuth)) {
        content = content.replace(targetAuth, replacementAuth);
        modified = true;
      }
      if (content.includes(targetMain)) {
        content = content.replace(targetMain, replacementMain);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated cache buster: ${filePath}`);
      }
    }
  });
}

updateHtmlFiles('.', '');
updateHtmlFiles('./ro', '../');

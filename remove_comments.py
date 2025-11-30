import os
import re
import tokenize
from io import BytesIO

def clean_python(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        
        tokens = tokenize.tokenize(BytesIO(source.encode('utf-8')).readline)
        new_tokens = []
        for token in tokens:
            if token.type != tokenize.COMMENT:
                new_tokens.append(token)
        
        clean_source = tokenize.untokenize(new_tokens)
        
        # Remove empty lines that might have been left behind
        clean_source = re.sub(r'\n\s*\n', '\n', clean_source)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(clean_source)
        print(f"Cleaned {filepath}")
    except Exception as e:
        print(f"Failed to clean {filepath}: {e}")

def clean_js(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # Regex to match strings or comments
        # Group 1: Strings (double, single, backtick)
        # Group 2: Comments (block, line)
        pattern = r'("[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\'|`[^`\\]*(?:\\.[^`\\]*)*`)|(/\*[^*]*\*+(?:[^/*][^*]*\*+)*/|//.*)'
        
        def replacer(match):
            if match.group(2):
                return "" # It's a comment
            return match.group(1) # It's a string
            
        clean_text = re.sub(pattern, replacer, text)
        
        # Remove empty lines
        clean_text = re.sub(r'^\s*$\n', '', clean_text, flags=re.MULTILINE)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(clean_text)
        print(f"Cleaned {filepath}")
    except Exception as e:
        print(f"Failed to clean {filepath}: {e}")

def main():
    root_dir = os.getcwd()
    
    # Backend
    backend_dir = os.path.join(root_dir, 'backend')
    if os.path.exists(backend_dir):
        for root, dirs, files in os.walk(backend_dir):
            if 'venv' in root or '__pycache__' in root:
                continue
            for file in files:
                if file.endswith('.py'):
                    clean_python(os.path.join(root, file))
    
    # Frontend
    frontend_dir = os.path.join(root_dir, 'perspectiq')
    if os.path.exists(frontend_dir):
        for root, dirs, files in os.walk(frontend_dir):
            if 'node_modules' in root:
                continue
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                    clean_js(os.path.join(root, file))

if __name__ == "__main__":
    main()

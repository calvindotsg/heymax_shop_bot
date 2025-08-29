# Suggested Development Commands

## Environment Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies (after requirements.txt is created)
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt
```

## Development Workflow

```bash
# Run the bot locally
python main.py

# Run with environment variables
BOT_TOKEN=your_token python main.py

# Run tests (when implemented)
pytest tests/

# Run tests with coverage
pytest --cov=src tests/
```

## Code Quality

```bash
# Format code (when implemented)
black src/ tests/

# Lint code (when implemented)
flake8 src/ tests/
# or
pylint src/

# Type checking (when implemented)
mypy src/
```

## Git Workflow

```bash
# Standard git operations
git status
git add .
git commit -m "descriptive message"
git push origin main

# Create feature branch
git checkout -b feature/bot-inline-queries
```

## System Utilities (macOS)

```bash
# Directory navigation
ls -la
cd /path/to/directory
find . -name "*.py"

# File operations
grep -r "pattern" src/
cat filename.py
head -n 10 filename.py
tail -n 10 filename.py

# Process management
ps aux | grep python
kill -9 PID
```

## Telegram Bot Testing

```bash
# Set webhook (production)
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -d "url=https://yourdomain.com/webhook"

# Remove webhook (development)
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"

# Get bot info
curl "https://api.telegram.org/bot<BOT_TOKEN>/getMe"
```

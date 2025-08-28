# Code Style & Conventions

## Python Style Guidelines
- **PEP 8**: Follow Python Enhancement Proposal 8 for code style
- **Line Length**: 88 characters (Black formatter default)
- **Imports**: Organize imports (stdlib, third-party, local)
- **Naming Conventions**:
  - Functions/variables: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private methods: `_leading_underscore`

## Code Organization
```python
# File structure example
"""Module docstring."""

import os
import sys

import requests
from telegram import Update
from telegram.ext import Application

from src.config import Settings
from src.utils import helper_function

# Constants
BOT_TOKEN = os.getenv("BOT_TOKEN")
API_BASE_URL = "https://api.heymax.com"

class BotHandler:
    """Bot message handler class."""
    pass
```

## Documentation Standards
- **Docstrings**: Use Google-style docstrings
- **Type Hints**: Include type annotations for function parameters and returns
- **Comments**: Explain complex business logic, not obvious code

```python
def generate_affiliate_link(user_id: str, merchant_slug: str) -> dict[str, str]:
    """Generate personalized affiliate link for user and merchant.
    
    Args:
        user_id: Telegram user identifier
        merchant_slug: HeyMax merchant slug identifier
        
    Returns:
        Dictionary containing affiliate link and tracking data
        
    Raises:
        ValueError: If merchant not found in HeyMax database
    """
```

## Error Handling
- Use specific exception types
- Log errors appropriately
- Provide meaningful error messages to users
- Implement graceful degradation for API failures

## Testing Conventions
- **File naming**: `test_*.py` or `*_test.py`
- **Test methods**: `test_method_name_scenario`
- **Fixtures**: Use pytest fixtures for common test data
- **Mocking**: Mock external API calls (HeyMax, Telegram)
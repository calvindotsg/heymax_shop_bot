# Project Structure

## Current Structure
```
heymax_shop_bot/
├── .serena/
│   ├── project.yml
│   └── memories/
├── hackathon_pitch.md
└── .DS_Store
```

## Planned Structure
```
heymax_shop_bot/
├── src/
│   ├── __init__.py
│   ├── main.py              # Bot entry point
│   ├── bot/
│   │   ├── __init__.py
│   │   ├── handlers.py      # Message/inline query handlers
│   │   ├── commands.py      # Bot commands
│   │   └── keyboards.py     # Inline keyboard definitions
│   ├── heymax/
│   │   ├── __init__.py
│   │   ├── client.py        # HeyMax API client
│   │   ├── models.py        # Data models
│   │   └── affiliate.py     # Affiliate link generation
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logging.py       # Logging configuration
│   │   └── validators.py    # Input validation
│   └── config.py           # Configuration management
├── tests/
│   ├── __init__.py
│   ├── test_bot/
│   ├── test_heymax/
│   └── test_utils/
├── data/
│   └── merchants.json       # HeyMax merchant dataset
├── docs/
│   ├── api.md
│   └── deployment.md
├── .env.example             # Environment variables template
├── .gitignore
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies
├── README.md
└── hackathon_pitch.md
```

## Key Directories
- **src/**: Main application code
- **src/bot/**: Telegram bot specific functionality
- **src/heymax/**: HeyMax API integration and affiliate logic
- **tests/**: Unit and integration tests
- **data/**: Static data files (merchant dataset)
- **docs/**: Project documentation
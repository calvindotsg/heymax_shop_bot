# Task Completion Checklist

## Before Code Commit
1. **Code Quality**
   - [ ] Run code formatter: `black src/ tests/`
   - [ ] Run linter: `flake8 src/ tests/` or `pylint src/`
   - [ ] Run type checker: `mypy src/` (when implemented)
   - [ ] Remove debug print statements and unused imports

2. **Testing**
   - [ ] Run all tests: `pytest tests/`
   - [ ] Ensure test coverage: `pytest --cov=src tests/`
   - [ ] Add new tests for new functionality
   - [ ] Update existing tests if API changes

3. **Documentation**
   - [ ] Update docstrings for new/modified functions
   - [ ] Update README.md if user-facing changes
   - [ ] Update API documentation if endpoints change

## Bot-Specific Checks
1. **Telegram Integration**
   - [ ] Test bot commands in development environment
   - [ ] Verify inline query responses format correctly
   - [ ] Check error handling for malformed commands
   - [ ] Test with different user permissions (group admin, member)

2. **HeyMax Integration**
   - [ ] Verify affiliate links generate correctly
   - [ ] Test with valid/invalid merchant slugs
   - [ ] Check tracking parameters are properly embedded
   - [ ] Validate against HeyMax merchant dataset schema

3. **Security & Privacy**
   - [ ] No hardcoded tokens or API keys
   - [ ] Sensitive data properly handled
   - [ ] User data minimization principles followed
   - [ ] Rate limiting implemented for API calls

## Deployment Preparation
1. **Environment Configuration**
   - [ ] Environment variables documented
   - [ ] Configuration validation implemented
   - [ ] Webhook URLs configured correctly

2. **Monitoring & Logging**
   - [ ] Error logging implemented
   - [ ] Success metrics tracked
   - [ ] User interaction analytics (privacy-compliant)

## Git Workflow
1. **Commit Standards**
   - [ ] Descriptive commit message
   - [ ] Single logical change per commit
   - [ ] No merge conflicts

2. **Branch Management**
   - [ ] Feature branch used for development
   - [ ] Clean merge to main branch
   - [ ] Delete feature branch after merge
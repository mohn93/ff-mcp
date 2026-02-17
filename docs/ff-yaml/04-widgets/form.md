# Form

The Form widget wraps child TextField widgets and defines validation rules for each referenced field via `nodeKeyRef`.

## Minimal Example

```yaml
key: Form_xxxxxxxx
type: Form
props:
  form:
    validations:
      - isRequired: true
        text:
          isRequiredFailMsg:
            textValue:
              inputValue: Field is required
        nodeKeyRef:
          key: TextField_xxxxxxxx
```

## Full Schema

```yaml
key: Form_xxxxxxxx
type: Form
props:
  form:
    validations:                         # Array of field validations
      - isRequired: true                 # Whether field must have a value
        text:                            # Text-specific validation rules
          isRequiredFailMsg:             # Error when field is empty
            translationIdentifier:
              key: thtawt3t              # i18n key
            textValue:
              inputValue: Email is required
          emailRegex: true               # Validate as email format
          invalidTextFailMsg:            # Error when format is invalid
            translationIdentifier:
              key: 83p8ztr3
            textValue:
              inputValue: Invalid email
          minimumCharacters: 8           # Minimum character count
          minimumCharactersFailMsg:       # Error when too short
            translationIdentifier:
              key: sbu1wvm2
            textValue:
              inputValue: Password should be at least 8 characters
          selectedOptionFailMsg:          # Error for dropdown validation
            translationIdentifier:
              key: z5j1zitb
            textValue:
              inputValue: Please choose an option from the dropdown
        nodeKeyRef:                      # Reference to the TextField being validated
          key: TextField_mxlvp4hj        # Must match a child TextField's key
    autovalidateMode: DISABLED           # When to run validation (see enum)
name: CreateAccountForm                  # Human-readable name
```

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `validations` | array | Yes | List of validation rules |
| `validations[].isRequired` | bool | Yes | Whether field is mandatory |
| `validations[].nodeKeyRef.key` | string | Yes | Key of TextField being validated |
| `validations[].text.isRequiredFailMsg.textValue.inputValue` | string | No | Required field error message |
| `validations[].text.emailRegex` | bool | No | Enable email format validation |
| `validations[].text.invalidTextFailMsg.textValue.inputValue` | string | No | Invalid format error message |
| `validations[].text.minimumCharacters` | number | No | Minimum character count |
| `validations[].text.minimumCharactersFailMsg.textValue.inputValue` | string | No | Too-short error message |
| `validations[].text.selectedOptionFailMsg.textValue.inputValue` | string | No | Dropdown selection error |
| `autovalidateMode` | enum | No | When validation runs |

## autovalidateMode Enum

| Value | Description |
|-------|-------------|
| `DISABLED` | Validate only when form is submitted |
| `ALWAYS` | Validate on every change |
| `ON_USER_INTERACTION` | Validate after first user interaction |

## Validation Rule Patterns

### Email validation

```yaml
- isRequired: true
  text:
    isRequiredFailMsg:
      translationIdentifier:
        key: auto_key
      textValue:
        inputValue: Email is required
    emailRegex: true
    invalidTextFailMsg:
      translationIdentifier:
        key: auto_key
      textValue:
        inputValue: Invalid email
    selectedOptionFailMsg:
      translationIdentifier:
        key: auto_key
      textValue:
        inputValue: Please choose an option from the dropdown
  nodeKeyRef:
    key: TextField_xxxxxxxx
```

### Password validation (minimum length)

```yaml
- isRequired: true
  text:
    minimumCharacters: 8
    isRequiredFailMsg:
      translationIdentifier:
        key: auto_key
      textValue:
        inputValue: Password is required
    minimumCharactersFailMsg:
      translationIdentifier:
        key: auto_key
      textValue:
        inputValue: Password should be at least 8 characters
    selectedOptionFailMsg:
      translationIdentifier:
        key: auto_key
      textValue:
        inputValue: Please choose an option from the dropdown
  nodeKeyRef:
    key: TextField_xxxxxxxx
```

## Real Examples

**Sign-up form with email + password + confirm password:**
```yaml
key: Form_jc5tby3y
type: Form
props:
  form:
    validations:
      - isRequired: true
        text:
          isRequiredFailMsg:
            translationIdentifier:
              key: thtawt3t
            textValue:
              inputValue: Email is required
          emailRegex: true
          invalidTextFailMsg:
            translationIdentifier:
              key: 83p8ztr3
            textValue:
              inputValue: Invalid email
          selectedOptionFailMsg:
            translationIdentifier:
              key: z5j1zitb
            textValue:
              inputValue: Please choose an option from the dropdown
        nodeKeyRef:
          key: TextField_mxlvp4hj
      - isRequired: true
        text:
          minimumCharacters: 8
          isRequiredFailMsg:
            translationIdentifier:
              key: boujkpn4
            textValue:
              inputValue: Password is required
          minimumCharactersFailMsg:
            translationIdentifier:
              key: sbu1wvm2
            textValue:
              inputValue: Password should be at least 8 characters
          selectedOptionFailMsg:
            translationIdentifier:
              key: z2z1i4c2
            textValue:
              inputValue: Please choose an option from the dropdown
        nodeKeyRef:
          key: TextField_3pu6ien6
      - isRequired: true
        text:
          minimumCharacters: 8
          isRequiredFailMsg:
            translationIdentifier:
              key: ymma4cep
            textValue:
              inputValue: Confirm Password is required
          minimumCharactersFailMsg:
            translationIdentifier:
              key: k7uzg7kn
            textValue:
              inputValue: Password should be at least 8 characters
          selectedOptionFailMsg:
            translationIdentifier:
              key: 470x2tex
            textValue:
              inputValue: Please choose an option from the dropdown
        nodeKeyRef:
          key: TextField_ym8v4ctz
    autovalidateMode: DISABLED
name: CreateAccountForm
```

**Login form with email + password:**
```yaml
key: Form_qmq6g118
type: Form
props:
  form:
    validations:
      - isRequired: true
        text:
          isRequiredFailMsg:
            translationIdentifier:
              key: jnz0yqtb
            textValue:
              inputValue: Email is required
          emailRegex: true
          invalidTextFailMsg:
            translationIdentifier:
              key: 35qqmeq4
            textValue:
              inputValue: Invalid email
          selectedOptionFailMsg:
            translationIdentifier:
              key: 3aimkf7e
            textValue:
              inputValue: Please choose an option from the dropdown
        nodeKeyRef:
          key: TextField_7g4icdhe
      - isRequired: true
        text:
          minimumCharacters: 8
          isRequiredFailMsg:
            translationIdentifier:
              key: 8sr1xmz2
            textValue:
              inputValue: Password is required
          minimumCharactersFailMsg:
            translationIdentifier:
              key: x694lubx
            textValue:
              inputValue: Password should be at least 8 characters
          selectedOptionFailMsg:
            translationIdentifier:
              key: ki9hw1nd
            textValue:
              inputValue: Please choose an option from the dropdown
        nodeKeyRef:
          key: TextField_z7y35e2t
name: LogInForm
```

# Script to update index.html with Tailwind local CSS and autocomplete attributes

$htmlFile = "c:\Projetos\Projeto CRM\public\index.html"
$content = Get-Content $htmlFile -Raw

# Remove Tailwind CDN script and inline config (lines 15-35)
$content = $content -replace '(?s)\s*<script src="https://cdn\.tailwindcss\.com"></script>.*?</script>\r?\n', "`r`n"

# Add autocomplete="current-password" to login password input
$content = $content -replace '(id="loginPassword"[^>]*)(required>)', '$1autocomplete="current-password" $2'

# Add autocomplete="new-password" to create account password input  
$content = $content -replace '(id="createPassword"[^>]*)(required>)', '$1autocomplete="new-password" $2'

# Write the updated content back
Set-Content -Path $htmlFile -Value $content -NoNewline

Write-Host "Successfully updated index.html"

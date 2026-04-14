import os

path = r'c:\Users\Mohammed Alkayal\Downloads\military_hr_system\components\PersonnelManager.tsx'
try:
    with open(path, 'rb') as f:
        raw = f.read()

    # Recovery logic:
    # 1. Decode as UTF-8 (includes the Mojibake)
    text = raw.decode('utf-8-sig')
    
    # 2. Re-encode to the 'mistaken' encoding (CP1256 for Arabic Windows)
    # Then decode as UTF-8 to get the original intended text.
    try:
        recovered_bytes = text.encode('cp1256')
        final_text = recovered_bytes.decode('utf-8')
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(final_text)
        print('SUCCESS: Recovery complete.')
    except Exception as e:
        print(f'CP1256 failed: {e}. Trying CP1252...')
        recovered_bytes = text.encode('cp1252')
        final_text = recovered_bytes.decode('utf-8')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(final_text)
        print('SUCCESS: Recovery complete via CP1252.')

except Exception as e:
    print(f'General error: {e}')

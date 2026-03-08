import pandas as pd

file_path = r"C:\Projetos\Projeto CRM\Controle_Rateio_Raizen.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    print("Sheet names:", xl.sheet_names)
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        print("Columns:")
        for i, col in enumerate(df.columns):
            print(f"  {i+1}: {col}")
        print("\nData (row 0 to 2):")
        for idx, row in df.head(3).iterrows():
            print(f"Row {idx}:")
            for col in df.columns:
                print(f"  {col}: {row[col]}")
except Exception as e:
    print(f"Error reading excel: {e}")

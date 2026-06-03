Execute this code to run the API endpoint.

On Windows PowerShell, activate your virtual environment first if you have one, then run:

Execute : python -m pip install -r requirements.txt

Execute : python -m uvicorn main:app --reload --port 8000

Goto : "http://127.0.0.1:8000/recommend/{investor_id}"

For fake data to be populated, execute : python seed.py
Populated data password : 123 for normal and admin123 for admin account.

Returns JSON
{
"investor_id" : investor_id,
"idea_ids" : { 1, 2, 3 ,...}
}

Returned ids are sorted. The idea with the highest match is at the front and with the lowest match is at the last. Use however many ideas are needed to be displayed.

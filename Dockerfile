FROM python:3.11-slim

WORKDIR /app

# Copy from the backend subfolder
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

EXPOSE 7860

CMD ["python", "app.py"]

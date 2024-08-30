import sys
import librosa
import json

def analyze_audio(audio_path):
    #Intentar carregar l'audio i obtenir la duració i el bpm
    try:
        y, sr = librosa.load(audio_path)
        duracio = librosa.get_duration(y=y, sr=sr)
        bpm, _ = librosa.beat.beat_track(y=y, sr=sr)
        return float(duracio), float(bpm)
    except Exception as e:
        print(f"Error analitzant l\'audio: {e}", file=sys.stderr)
        return None, None

if __name__ == "__main__":
    #Obtenir l'argument de la línia de comandes(path de l'audio)
    audio_path = sys.argv[1]
    duracio, bpm = analyze_audio(audio_path)
    #Si s'ha pogut analitzar l'audio, retornar la duració i els bpm
    if duracio is not None and bpm is not None:
        print(json.dumps({"duracio": duracio, "bpm": bpm}))
    else:
        print(json.dumps({"error": "Error analitzant l\'audio"}))
import { Zone } from '../types';

export async function getIrrigationAdvice(
  zone: Zone,
  weatherCondition: string
): Promise<string> {
  // Service AI désactivé - retourne un conseil générique
  const soilMoisture = zone.currentReading.soilMoisture10cm;
  
  if (soilMoisture < 30) {
    return "🚨 Niveau d'humidité critique ! Irrigation immédiate recommandée pour éviter le stress hydrique de vos cultures.";
  } else if (soilMoisture < 50) {
    return "⚠️ Humidité modérée. Surveillez l'évolution et préparez une irrigation si la tendance continue à la baisse.";
  } else if (soilMoisture > 85) {
    return "💧 Niveau d'humidité très élevé. Évitez l'irrigation pour prévenir la saturation et les maladies racinaires.";
  } else {
    return "✅ Conditions optimales ! Maintenez votre stratégie d'irrigation actuelle.";
  }
}

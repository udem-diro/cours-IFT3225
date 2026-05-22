---
title: Codes de statut HTTP
description: Référence des codes de statut HTTP les plus courants
---

## 1xx — Information

| Code | Signification |
|------|---------------|
| `100` | Continue |
| `101` | Switching Protocols (ex: vers WebSocket) |

## 2xx — Succès

| Code | Signification | Usage courant |
|------|---------------|---------------|
| `200` | OK | Requête réussie |
| `201` | Created | Ressource créée (POST) |
| `204` | No Content | Succès sans corps (DELETE) |

## 3xx — Redirection

| Code | Signification | Usage courant |
|------|---------------|---------------|
| `301` | Moved Permanently | URL changée définitivement |
| `302` | Found | Redirection temporaire |
| `304` | Not Modified | Ressource en cache valide |

## 4xx — Erreur client

| Code | Signification | Usage courant |
|------|---------------|---------------|
| `400` | Bad Request | Requête malformée |
| `401` | Unauthorized | Authentification requise |
| `403` | Forbidden | Accès refusé (même authentifié) |
| `404` | Not Found | Ressource inexistante |
| `405` | Method Not Allowed | Méthode HTTP non supportée |
| `409` | Conflict | Conflit avec l'état actuel |
| `422` | Unprocessable Entity | Validation échouée |
| `429` | Too Many Requests | Limite de débit atteinte |

## 5xx — Erreur serveur

| Code | Signification | Usage courant |
|------|---------------|---------------|
| `500` | Internal Server Error | Erreur non gérée côté serveur |
| `502` | Bad Gateway | Proxy/reverse proxy n'obtient pas de réponse |
| `503` | Service Unavailable | Serveur surchargé ou en maintenance |
| `504` | Gateway Timeout | Timeout du proxy |

## Bonnes pratiques

En développement d'API REST, choisir le code de statut approprié améliore la clarté pour les clients :

- `POST` qui crée → `201 Created` avec l'objet créé
- `DELETE` réussi → `204 No Content`
- Validation échouée → `422` avec détails des erreurs
- Ressource non trouvée → `404` avec message descriptif

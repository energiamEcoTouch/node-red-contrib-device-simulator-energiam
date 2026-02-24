# node-red-contrib-device-simulator-energiam

**EnergIAM — IoT Device Simulator for Node-RED**

Nodo custom para Node-RED que simula dispositivos IoT (zigbee2mqtt, sensores Modbus, medidores de energía, etc.) inyectando objetos JSON configurables con campos variables, intervalos flexibles y disparo condicional por cambio de valor.

Diseñado para desarrollo, testing y simulación de entornos productivos sin necesidad de hardware físico.

---

## ✨ Características

- 📋 **Template JSON libre** — pegá cualquier objeto que quieras simular
- 🎲 **Campos variables** — elegí qué campos numéricos varían y entre qué rangos
- ⏱️ **Intervalo fijo o aleatorio** — fijo en ms, o random entre un mínimo y máximo
- 🔔 **Disparo condicional** — configurá por campo si el mensaje se envía solo cuando ese valor cambia
- 🏷️ **Topic configurable** — compatible con cualquier pipeline MQTT/Node-RED
- 🟢 **Status en tiempo real** — el nodo muestra en el canvas si envió, si no hubo cambios, o si hay error

---

## 📦 Instalación

### Desde repositorio git (recomendado)

Accedé al contenedor Docker de Node-RED:

```bash
docker exec -it <nombre-contenedor-nodered> bash
```

Instalá el nodo directamente desde el repositorio:

```bash
cd /data
npm install git+https://github.com/<tu-usuario>/node-red-contrib-device-simulator-energiam.git
```

Reiniciá Node-RED:

```bash
# Desde fuera del contenedor
docker restart <nombre-contenedor-nodered>
```

### Actualizar a una nueva versión

```bash
docker exec -it <nombre-contenedor-nodered> bash
cd /data
npm install git+https://github.com/<tu-usuario>/node-red-contrib-device-simulator-energiam.git
docker restart <nombre-contenedor-nodered>
```

---

## 🚀 Uso rápido

1. Buscá **device simulator** en la paleta (categoría `simulation`)
2. Arrastrá el nodo al canvas
3. Doble click → abrís el editor
4. Pegá tu objeto JSON en **Template JSON** y presioná **Actualizar campos desde JSON**
5. Configurá los campos variables, rangos e intervalo
6. Deploy — el nodo empieza a inyectar

---

## ⚙️ Configuración del nodo

### Template JSON

Pegá el objeto JSON que quieras simular. Ejemplo con un medidor zigbee2mqtt:

```json
{
    "ac_frequency": 50.0,
    "voltage": 220.0,
    "current_a": 1.5,
    "power_a": 330.0,
    "energy_a": 12.4,
    "power_factor_a": 98,
    "linkquality": 105
}
```

Presioná **Actualizar campos desde JSON** — la tabla se llena automáticamente con todos los campos numéricos del objeto.

---

### Tabla de campos variables

| Columna | Descripción |
|---|---|
| **Campo** | Nombre de la clave en el JSON |
| **Variable** | Si está activado, el campo toma un valor random en cada ciclo |
| **Min / Max** | Rango de valores posibles |
| **Dispara si cambia** | Si está activado, el mensaje solo se envía cuando este campo cambia de valor |

> Si ningún campo tiene **Dispara si cambia** activo, el nodo siempre envía en cada ciclo.  
> Si uno o más campos lo tienen activo, el nodo solo envía si al menos uno de ellos cambió respecto al envío anterior.

---

### Intervalo

| Modo | Descripción |
|---|---|
| **Fijo** | Se envía cada N milisegundos |
| **Aleatorio** | El intervalo se recalcula en cada ciclo entre Mín y Máx ms |

---

### Topic

Topic del mensaje de salida. Compatible con cualquier nodo MQTT out, función, o switch de Node-RED.

Ejemplo: `zigbee2mqtt/medidor_sala_a1`

---

## 📡 Mensaje de salida

```json
{
    "topic": "zigbee2mqtt/medidor_sala_a1",
    "payload": {
        "ac_frequency": 49.87,
        "voltage": 218.34,
        "current_a": 1.62,
        "power_a": 341.5,
        "energy_a": 12.4,
        "power_factor_a": 97,
        "linkquality": 105
    }
}
```

Los campos no marcados como **Variable** conservan siempre el valor del template original.

---

## 🗂️ Estructura del repositorio

```
node-red-contrib-device-simulator-energiam/
│
├── device-simulator.js     # Lógica del nodo (backend Node-RED)
├── device-simulator.html   # UI del editor y help (frontend)
├── package.json
├── icons/
│   └── energiam.png        # Ícono del nodo en la paleta
└── README.md
```

---

## 🛠️ Stack

- **Node-RED** >= 3.0.0
- **Node.js** >= 18.0.0
- Sin dependencias externas

---

## 🔄 Compatibilidad

Probado con:

- [zigbee2mqtt](https://www.zigbee2mqtt.io/) — medidores de energía Tuya, Sonoff, etc.
- Medidores Modbus normalizados
- Cualquier dispositivo que publique JSON plano por MQTT

---

## 🔐 Licencia

MIT — libre uso, modificación y distribución.

---

## 👤 Autor

**EnergIAM by Adrian Iskow**  
Plataforma de gestión inteligente de energía  
Argentina, 2025

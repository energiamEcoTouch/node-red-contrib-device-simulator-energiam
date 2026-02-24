module.exports = function (RED) {

    function DeviceSimulatorNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // --- Parsear objeto base ---
        let baseObject = {};
        try {
            baseObject = JSON.parse(config.template || '{}');
        } catch (e) {
            node.error('Template JSON inválido: ' + e.message);
            node.status({ fill: 'red', shape: 'ring', text: 'JSON inválido' });
            return;
        }

        // --- Parsear configuración de campos variables ---
        // config.fields: array de { key, enabled, min, max, triggerOnChange }
        let fields = [];
        try {
            fields = JSON.parse(config.fields || '[]');
        } catch (e) {
            node.error('Configuración de fields inválida: ' + e.message);
            return;
        }

        // Estado interno: última copia del objeto enviado
        let lastPayload = JSON.parse(JSON.stringify(baseObject));

        // --- Función: generar valor aleatorio entre min y max ---
        function randomBetween(min, max) {
            return Math.round((Math.random() * (max - min) + min) * 1000) / 1000;
        }

        // --- Función: aplicar variaciones al objeto base ---
        function buildPayload() {
            const payload = JSON.parse(JSON.stringify(baseObject));

            for (const field of fields) {
                if (!field.enabled) continue;
                const min = parseFloat(field.min);
                const max = parseFloat(field.max);
                if (isNaN(min) || isNaN(max)) continue;
                payload[field.key] = randomBetween(min, max);
            }

            return payload;
        }

        // --- Función: decidir si hay que disparar ---
        // Si ningún field tiene triggerOnChange, siempre dispara
        // Si alguno tiene triggerOnChange, dispara solo si alguno de esos cambió
        function shouldSend(newPayload) {
            const triggerFields = fields.filter(f => f.enabled && f.triggerOnChange);
            if (triggerFields.length === 0) return true;

            for (const field of triggerFields) {
                if (newPayload[field.key] !== lastPayload[field.key]) return true;
            }
            return false;
        }

        // --- Función: calcular intervalo ---
        function getInterval() {
            const mode = config.intervalMode || 'fixed';
            if (mode === 'fixed') {
                return parseInt(config.intervalFixed) || 5000;
            } else {
                const min = parseInt(config.intervalMin) || 1000;
                const max = parseInt(config.intervalMax) || 10000;
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        }

        // --- Loop de inyección ---
        let timer = null;

        function scheduleNext() {
            const interval = getInterval();
            timer = setTimeout(function () {
                const newPayload = buildPayload();

                if (shouldSend(newPayload)) {
                    lastPayload = JSON.parse(JSON.stringify(newPayload));
                    node.send({
                        topic: config.topic || '',
                        payload: newPayload
                    });
                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: 'enviado ' + new Date().toLocaleTimeString()
                    });
                } else {
                    node.status({
                        fill: 'grey',
                        shape: 'ring',
                        text: 'sin cambios ' + new Date().toLocaleTimeString()
                    });
                }

                scheduleNext();
            }, interval);
        }

        // --- Arrancar ---
        node.status({ fill: 'blue', shape: 'ring', text: 'iniciando...' });
        scheduleNext();

        // --- Limpiar timer al cerrar ---
        node.on('close', function () {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            node.status({});
        });
    }

    RED.nodes.registerType('device-simulator', DeviceSimulatorNode, {
        defaults: {
            name:         { value: '' },
            topic:        { value: '' },
            template:     { value: '{}' },
            fields:       { value: '[]' },
            intervalMode: { value: 'fixed' },
            intervalFixed:{ value: 5000 },
            intervalMin:  { value: 1000 },
            intervalMax:  { value: 10000 }
        }
    });
};

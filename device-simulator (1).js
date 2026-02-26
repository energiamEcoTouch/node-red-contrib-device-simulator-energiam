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
        let fields = [];
        try {
            fields = JSON.parse(config.fields || '[]');
        } catch (e) {
            node.error('Configuración de fields inválida: ' + e.message);
            return;
        }

        // Estado interno
        let lastPayload   = JSON.parse(JSON.stringify(baseObject));
        let timer         = null;
        let startupTimer  = null;
        let debugActive   = config.debugActive === true;

        // --- Generar valor aleatorio entre min y max ---
        function randomBetween(min, max) {
            return Math.round((Math.random() * (max - min) + min) * 1000) / 1000;
        }

        // --- Aplicar variaciones al objeto base ---
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

        // --- Decidir si hay que disparar ---
        function shouldSend(newPayload) {
            const triggerFields = fields.filter(f => f.enabled && f.triggerOnChange);
            if (triggerFields.length === 0) return true;
            for (const field of triggerFields) {
                if (newPayload[field.key] !== lastPayload[field.key]) return true;
            }
            return false;
        }

        // --- Calcular intervalo ---
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

        // --- Emitir un mensaje ---
        function doSend(source) {
            const newPayload = buildPayload();
            if (shouldSend(newPayload)) {
                lastPayload = JSON.parse(JSON.stringify(newPayload));
                const outMsg = { topic: config.topic || '', payload: newPayload };
                node.send(outMsg);
                if (debugActive) {
                    RED.comms.publish('debug', {
                        id:    node.id,
                        name:  node.name || 'device simulator',
                        topic: config.topic || '',
                        msg:   { topic: config.topic || '', payload: newPayload },
                        _path: node._path
                    });
                }
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: (source || 'enviado') + ' ' + new Date().toLocaleTimeString()
                });
            } else {
                node.status({
                    fill: 'grey',
                    shape: 'ring',
                    text: 'sin cambios ' + new Date().toLocaleTimeString()
                });
            }
        }

        // --- Loop de inyección automática ---
        function scheduleNext() {
            const interval = getInterval();
            timer = setTimeout(function () {
                doSend('enviado');
                scheduleNext();
            }, interval);
        }

        // --- Limpiar timers ---
        function clearTimers() {
            if (timer) { clearTimeout(timer); timer = null; }
            if (startupTimer) { clearTimeout(startupTimer); startupTimer = null; }
        }

        // --- Arrancar con delay de inicio opcional ---
        const startupDelay = parseInt(config.startupDelay) || 0;
        node.status({ fill: 'blue', shape: 'ring', text: 'iniciando...' });

        startupTimer = setTimeout(function () {
            startupTimer = null;
            scheduleNext();
        }, startupDelay);

        // --- Entrada: disparo externo por mensaje entrante ---
        node.on('input', function (msg) {
            doSend('input');
        });

        // --- Endpoint HTTP para disparo desde botón del editor ---
        RED.httpAdmin.post(
            '/device-simulator/:id/inject',
            RED.auth.needsPermission('device-simulator.write'),
            function (req, res) {
                const n = RED.nodes.getNode(req.params.id);
                if (n) {
                    try {
                        n.receive({});
                        res.sendStatus(200);
                    } catch (err) {
                        res.sendStatus(500);
                        n.error('Error en disparo manual: ' + err.toString());
                    }
                } else {
                    res.sendStatus(404);
                }
            }
        );

        // --- Endpoint HTTP para toggle debug ---
        RED.httpAdmin.post(
            '/device-simulator/:id/debug',
            RED.auth.needsPermission('device-simulator.write'),
            function (req, res) {
                const n = RED.nodes.getNode(req.params.id);
                if (n) {
                    n._debugActive = !n._debugActive;
                    debugActive = n._debugActive;
                    res.json({ active: debugActive });
                } else {
                    res.sendStatus(404);
                }
            }
        );

        // Exponer estado debug para el frontend
        node._debugActive = debugActive;

        // --- Limpiar al cerrar ---
        node.on('close', function () {
            clearTimers();
            node.status({});
        });
    }

    RED.nodes.registerType('device-simulator', DeviceSimulatorNode, {
        defaults: {
            name:          { value: '' },
            topic:         { value: '' },
            template:      { value: '{}' },
            fields:        { value: '[]' },
            intervalMode:  { value: 'fixed' },
            intervalFixed: { value: 5000 },
            intervalMin:   { value: 1000 },
            intervalMax:   { value: 10000 },
            startupDelay:  { value: 0 },
            debugActive:   { value: false }
        }
    });
};

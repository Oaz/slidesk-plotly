class PlotlyCodeRenderer {
    constructor(selector) {
        this.selector = selector;
        this.init();
    }

    init() {
        document.querySelectorAll(this.selector).forEach(element => {
            if (element.dataset.plotlyProcessed === 'true') {
                return;
            }
            this.renderPlot(element);
        });
    }

    async renderPlot(codeElement) {
        // Add loading state
        codeElement.classList.add('plotly-code--loading');

        try {
            const plotData = await this.evaluateCode(codeElement);
            const plotContainer = this.createPlotContainer(codeElement);
            await this.renderPlotly(plotContainer, plotData);

            // Success state
            codeElement.classList.remove('plotly-code--loading');
            codeElement.classList.add('plotly-code--rendered');
            codeElement.style.display = 'none';
            codeElement.dataset.plotlyProcessed = 'true';
        } catch (error) {
            this.handleError(codeElement, error);
        }
    }

    async evaluateCode(codeElement) {
        const code = codeElement.textContent.trim();

        // Use Function constructor for slightly better security
        const func = new Function(`return (${code})`);
        let result = func();

        // Handle async data functions
        if (typeof result === 'function') {
            result = await result();
        }

        return result;
    }

    createPlotContainer(codeElement) {
        const container = document.createElement('div');
        container.className = 'plotly-container';
        codeElement.parentNode.insertBefore(container, codeElement.nextSibling);
        return container;
    }

    async renderPlotly(container, plotData) {
        if (!plotData) {
            throw new Error('No plot data provided');
        }

        const defaultConfig = {
            responsive: false,
            displayModeBar: false,
            displaylogo: false
        };

        // Default layout for presentation-friendly large text
        const presentationLayout = {
            height : 700,
            font: {
                size: 36,  // Base font size for all text
                family: 'Arial, sans-serif'
            },
            title: {
                font: { size: 40 }  // Even larger for titles
            },
            xaxis: {
                title: {
                    font: { size: 32 }    // X-axis title
                },
                tickfont: { size: 24 }      // X-axis tick labels
            },
            yaxis: {
                title: {
                    font: { size: 32 }    // Y-axis title
                },
                tickfont: { size: 24 }      // Y-axis tick labels
            },
            legend: {
                font: { size: 24 }          // Legend text
            }
        };

        if (plotData.data && plotData.layout) {
            const layout = this.deepMerge(presentationLayout, plotData.layout);
            console.log(layout);
            const config = { ...defaultConfig, ...(plotData.config || {}) };
            return Plotly.newPlot(container, plotData.data, layout, config);
        } else if (Array.isArray(plotData)) {
            return Plotly.newPlot(container, plotData, presentationLayout, defaultConfig);
        } else if (plotData.figure) {
            const layout = this.deepMerge(presentationLayout, plotData.figure.layout);
            const config = { ...defaultConfig, ...(plotData.config || {}) };
            return Plotly.newPlot(container, plotData.figure.data, layout, config);
        } else {
            throw new Error('Invalid Plotly data structure');
        }
    }

    deepMerge(target, source) {
        if (!source || typeof source !== 'object') {
            return source !== undefined ? source : target;
        }
        if (!target || typeof target !== 'object') {
            return source;
        }

        if (Array.isArray(source)) {
            return source;
        }
        if (Array.isArray(target)) {
            return source;
        }

        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    handleError(codeElement, error) {
        console.error('Plotly rendering error:', error);
        codeElement.classList.remove('plotly-code--loading');
        codeElement.classList.add('plotly-code--error');
        codeElement.title = `Error: ${error.message}`;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'plotly-error';
        errorDiv.innerHTML = `<strong>Plotly Error:</strong> ${error.message}`;

        codeElement.parentNode.insertBefore(errorDiv, codeElement.nextSibling);
    }
}

/**
 * ARKANSAS // Fiscal Core Client-Side Logic Engine
 */

// Core App State Containers
let baseFunnel = {};
let paretoData = {};
let miniLedger = [];

// Global Canvas Graphic Context Bindings
let funnelChart, paretoChart;

document.addEventListener("DOMContentLoaded", async () => {
    initECharts();
    await fetchStaticDataLake();
    renderBaseDashboard();
    populateAgencyControls();
    initSimulationEngine();
});

function initECharts() {
    funnelChart = echarts.init(document.getElementById('funnel-chart'), 'dark');
    paretoChart = echarts.init(document.getElementById('pareto-chart'), 'dark');
    
    window.addEventListener('resize', () => {
        funnelChart.resize();
        paretoChart.resize();
    });
}

async function fetchStaticDataLake() {
    try {
        // Asynchronously stream aggregated ledger datasets down from target folder tree
        const [funnelRes, paretoRes, ledgerRes] = await Promise.all([
            fetch('./data/budget_funnel.json').then(r => r.json()),
            fetch('./data/agency_pareto.json').then(r => r.json()),
            fetch('./data/mini_ledger.json').then(r => r.json())
        ]);

        baseFunnel = funnelRes;
        paretoData = paretoRes;
        miniLedger = ledgerRes;
    } catch (err) {
        console.error("Data pipeline asset collection dropped. Verify build path locations.", err);
    }
}

function renderBaseDashboard() {
    renderFunnel(baseFunnel.stages);
    document.getElementById('metric-liability').innerText = `$${baseFunnel.stages[1].value.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
}

function renderFunnel(stagesData) {
    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: "{b}: ${c}" },
        series: [{
            name: 'Fiscal Flow Limit',
            type: 'funnel',
            left: '10%', right: '10%', top: '5%', bottom: '5%',
            width: '80%', sort: 'descending', gap: 6,
            label: { show: true, position: 'inside', fontStyle: 'monospace', formatter: '{b}\n${c}' },
            itemStyle: { borderColor: '#0f172a', borderWidth: 2 },
            colors: ['#06b6d4', '#0ea5e9', '#3b82f6', '#ef4444'],
            data: stagesData
        }]
    };
    funnelChart.setOption(option);
}

function initSimulationEngine() {
    const sliderReduction = document.getElementById('slider-reduction');
    const sliderOverrun = document.getElementById('slider-overrun');

    const computeSimulatedYield = () => {
        const costCutFactor = parseFloat(sliderReduction.value) / 100;
        const overrunCapFactor = parseFloat(sliderOverrun.value) / 100;

        document.getElementById('reduction-val').innerText = `${sliderReduction.value}% Cut`;
        document.getElementById('overrun-val').innerText = `${sliderOverrun.value}% Capped`;

        let totalSaved = 0;
        let simulatedLiability = 0;

        // Stream grouped data matrices through runtime multi-variable calculations
        miniLedger.forEach(row => {
            let contractVal = row.ContractValue;
            let poOrdered = row.POOrdered;
            let initialVariance = poOrdered - contractVal;

            let adjustedContract = contractVal * (1 - costCutFactor);
            let adjustedPO = poOrdered;

            if (initialVariance > 0 && overrunCapFactor > 0) {
                adjustedPO = contractVal + (initialVariance * (1 - overrunCapFactor));
            }

            let initialCost = poOrdered;
            let adjustedCost = adjustedPO;
            
            totalSaved += Math.max(0, initialCost - adjustedCost);
            simulatedLiability += adjustedCost;
        });

        // Mutate numbers on screen smoothly
        document.getElementById('metric-recovery').innerText = `$${totalSaved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('metric-liability').innerText = `$${simulatedLiability.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        const runtimeStages = [
            { value: baseFunnel.stages[0].value * (1 - costCutFactor), name: "Approved Contract Budget" },
            { value: baseFunnel.stages[1].value - totalSaved, name: "Purchase Orders Issued" },
            { value: baseFunnel.stages[2].value, name: "Liquid Capital Cashed Out" },
            { value: baseFunnel.stages[3].value * (1 - overrunCapFactor), name: "Unplanned Fiscal Overruns" }
        ];
        renderFunnel(runtimeStages);
    };

    sliderReduction.addEventListener('input', computeSimulatedYield);
    sliderOverrun.addEventListener('input', computeSimulatedYield);
}

function populateAgencyControls() {
    const container = document.getElementById('agency-buttons');
    Object.keys(paretoData).forEach(agencyName => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-medium tracking-wide transition duration-150 text-slate-200 cursor-pointer active:scale-95";
        btn.innerText = agencyName;
        btn.onclick = () => openParetoModal(agencyName);
        container.appendChild(btn);
    });
}

function openParetoModal(agencyName) {
    const node = paretoData[agencyName];
    document.getElementById('modal-title').innerText = `Pareto Concentration: ${agencyName}`;
    document.getElementById('pareto-modal').classList.remove('hidden');

    const truncatedVendors = node.vendors.map(v => v.length > 20 ? v.substring(0, 18) + '...' : v);

    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        grid: { left: '15%', right: '12%', bottom: '18%', top: '12%' },
        xAxis: [{ type: 'category', data: truncatedVendors, axisLabel: { interval: 0, rotate: 15, fontSize: 10 } }],
        yAxis: [
            { 
                type: 'value', 
                name: 'Approved Cap ($)', 
                axisLabel: { 
                    formatter: function (value) {
                        if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
                        if (value >= 1e6) return '$' + (value / 1e6).toFixed(0) + 'M';
                        if (value >= 1e3) return '$' + (value / 1e3).toFixed(0) + 'K';
                        return '$' + value;
                    }
                } 
            },
            { type: 'value', name: 'Percentage (%)', min: 0, max: 100, axisLabel: { formatter: '{value}%' } }
        ],
        series: [
            { name: 'Total Allocation Limit', type: 'bar', barWidth: '40%', data: node.spend, itemStyle: { color: '#06b6d4', borderRadius: [4, 4, 0, 0] } },
            { name: 'Cumulative Baseline Share', type: 'line', yAxisIndex: 1, data: node.cumulative_percentage, itemStyle: { color: '#ef4444' }, lineStyle: { width: 3 } }
        ]
    };

    setTimeout(() => {
        paretoChart.resize();
        paretoChart.setOption(option);
    }, 50);
}

function closeModal() {
    document.getElementById('pareto-modal').classList.add('hidden');
}